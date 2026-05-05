import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Slot } from '@/models/Slot';
import { ApiError, apiError, requireRole, ADMIN_ROLES } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface BlockInput {
  startTime: string;
  endTime: string;
}

interface BulkBody {
  from: string;
  to: string;
  weekdays: number[]; // 0..6 (0=Sun, 1=Mon, ... 6=Sat)
  blocks: BlockInput[];
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function eachDate(fromStr: string, toStr: string): string[] {
  const out: string[] = [];
  const start = new Date(`${fromStr}T00:00:00`);
  const end = new Date(`${toStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  if (end < start) return out;
  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(`${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

export async function POST(req: Request) {
  try {
    await requireRole(ADMIN_ROLES);
    await connectDB();
    const body = (await req.json()) as Partial<BulkBody>;

    const { from, to, weekdays, blocks } = body ?? {};
    if (!from || !DATE_RE.test(from)) throw new ApiError('Invalid "from" date');
    if (!to || !DATE_RE.test(to)) throw new ApiError('Invalid "to" date');
    if (!Array.isArray(weekdays) || weekdays.length === 0) throw new ApiError('Pick at least one working day');
    if (!Array.isArray(blocks) || blocks.length === 0) throw new ApiError('Add at least one time block');

    const validWeekdays = weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (validWeekdays.length === 0) throw new ApiError('No valid weekdays');

    const validBlocks: BlockInput[] = [];
    for (const b of blocks) {
      if (!b || !TIME_RE.test(String(b.startTime ?? '')) || !TIME_RE.test(String(b.endTime ?? ''))) {
        throw new ApiError('Each time block needs valid start and end times');
      }
      if (b.startTime >= b.endTime) {
        throw new ApiError(`Time block ${b.startTime}–${b.endTime} is invalid (end must be after start)`);
      }
      validBlocks.push({ startTime: b.startTime, endTime: b.endTime });
    }
    // Detect block-vs-block overlap inside the same payload to avoid creating
    // self-conflicting slots on the same day.
    for (let i = 0; i < validBlocks.length; i++) {
      for (let j = i + 1; j < validBlocks.length; j++) {
        if (overlaps(validBlocks[i].startTime, validBlocks[i].endTime, validBlocks[j].startTime, validBlocks[j].endTime)) {
          throw new ApiError(
            `Time blocks ${validBlocks[i].startTime}–${validBlocks[i].endTime} and ${validBlocks[j].startTime}–${validBlocks[j].endTime} overlap each other`
          );
        }
      }
    }

    const dates = eachDate(from, to).filter((d) => validWeekdays.includes(weekdayOf(d)));
    if (dates.length === 0) throw new ApiError('No matching dates in the selected range');

    // Pre-fetch existing slots in the range to detect conflicts in a single query.
    const existing = await Slot.find({ date: { $gte: from, $lte: to } }).lean();
    const byDate = new Map<string, { startTime: string; endTime: string }[]>();
    for (const s of existing) {
      const doc = s as unknown as { date: string; startTime: string; endTime: string };
      const arr = byDate.get(doc.date) ?? [];
      arr.push({ startTime: doc.startTime, endTime: doc.endTime });
      byDate.set(doc.date, arr);
    }

    const skipped: { date: string; startTime: string; endTime: string; reason: string }[] = [];
    const toInsert: { date: string; startTime: string; endTime: string; status: 'available' }[] = [];

    for (const date of dates) {
      const dayExisting = byDate.get(date) ?? [];
      const accepted: { startTime: string; endTime: string }[] = [];
      for (const block of validBlocks) {
        const conflict =
          dayExisting.some((e) => overlaps(e.startTime, e.endTime, block.startTime, block.endTime)) ||
          accepted.some((e) => overlaps(e.startTime, e.endTime, block.startTime, block.endTime));
        if (conflict) {
          skipped.push({ date, startTime: block.startTime, endTime: block.endTime, reason: 'overlaps existing slot' });
          continue;
        }
        accepted.push({ startTime: block.startTime, endTime: block.endTime });
        toInsert.push({ date, startTime: block.startTime, endTime: block.endTime, status: 'available' });
      }
    }

    let created: typeof toInsert = [];
    if (toInsert.length > 0) {
      const inserted = await Slot.insertMany(toInsert, { ordered: false });
      created = listJSON(inserted as never[]) as typeof toInsert;
    }

    return NextResponse.json({
      created: created.length,
      skipped,
      slots: created,
    });
  } catch (err) {
    return apiError(err);
  }
}
