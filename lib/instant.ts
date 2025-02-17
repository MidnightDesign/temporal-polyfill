import { DEBUG } from './debug';
import * as ES from './ecmascript';
import { MakeIntrinsicClass } from './intrinsicclass';
import { EPOCHNANOSECONDS, CreateSlots, GetSlot, SetSlot } from './slots';
import type { Temporal } from '..';
import { DateTimeFormat } from './intl';
import type { InstantParams as Params, InstantReturn as Return } from './internaltypes';

import JSBI from 'jsbi';
import { BILLION, MILLION, THOUSAND } from './ecmascript';

export class Instant implements Temporal.Instant {
  constructor(epochNanoseconds: bigint | JSBI) {
    // Note: if the argument is not passed, ToBigInt(undefined) will throw. This check exists only
    //       to improve the error message.
    if (arguments.length < 1) {
      throw new TypeError('missing argument: epochNanoseconds is required');
    }

    const ns = ES.ToBigInt(epochNanoseconds);
    ES.ValidateEpochNanoseconds(ns);
    CreateSlots(this);
    SetSlot(this, EPOCHNANOSECONDS, ns);

    if (DEBUG) {
      const repr = ES.TemporalInstantToString(this, undefined, 'auto');
      Object.defineProperty(this, '_repr_', {
        value: `${this[Symbol.toStringTag]} <${repr}>`,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }

  get epochSeconds(): Return['epochSeconds'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    const value = GetSlot(this, EPOCHNANOSECONDS);
    return JSBI.toNumber(JSBI.divide(value, BILLION));
  }
  get epochMilliseconds(): Return['epochMilliseconds'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    const value = JSBI.BigInt(GetSlot(this, EPOCHNANOSECONDS));
    return JSBI.toNumber(JSBI.divide(value, MILLION));
  }
  get epochMicroseconds(): Return['epochMicroseconds'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    const value = JSBI.BigInt(GetSlot(this, EPOCHNANOSECONDS));
    return ES.ToBigIntExternal(JSBI.divide(value, THOUSAND));
  }
  get epochNanoseconds(): Return['epochNanoseconds'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.ToBigIntExternal(JSBI.BigInt(GetSlot(this, EPOCHNANOSECONDS)));
  }

  add(temporalDurationLike: Params['add'][0]): Return['add'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.AddDurationToOrSubtractDurationFromInstant('add', this, temporalDurationLike);
  }
  subtract(temporalDurationLike: Params['subtract'][0]): Return['subtract'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.AddDurationToOrSubtractDurationFromInstant('subtract', this, temporalDurationLike);
  }
  until(other: Params['until'][0], options: Params['until'][1] = undefined): Return['until'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.DifferenceTemporalInstant('until', this, other, options);
  }
  since(other: Params['since'][0], options: Params['since'][1] = undefined): Return['since'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.DifferenceTemporalInstant('since', this, other, options);
  }
  round(optionsParam: Params['round'][0]): Return['round'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    if (optionsParam === undefined) throw new TypeError('options parameter is required');
    const options =
      typeof optionsParam === 'string'
        ? (ES.CreateOnePropObject('smallestUnit', optionsParam) as Exclude<typeof optionsParam, string>)
        : ES.GetOptionsObject(optionsParam);
    const smallestUnit = ES.GetTemporalUnit(options, 'smallestUnit', 'time', ES.REQUIRED);
    const roundingMode = ES.ToTemporalRoundingMode(options, 'halfExpand');
    const maximumIncrements = {
      hour: 24,
      minute: 1440,
      second: 86400,
      millisecond: 86400e3,
      microsecond: 86400e6,
      nanosecond: 86400e9
    };
    const roundingIncrement = ES.ToTemporalRoundingIncrement(options, maximumIncrements[smallestUnit], true);
    const ns = GetSlot(this, EPOCHNANOSECONDS);
    const roundedNs = ES.RoundInstant(ns, roundingIncrement, smallestUnit, roundingMode);
    return new Instant(roundedNs);
  }
  equals(otherParam: Params['equals'][0]): Return['equals'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    const other = ES.ToTemporalInstant(otherParam);
    const one = GetSlot(this, EPOCHNANOSECONDS);
    const two = GetSlot(other, EPOCHNANOSECONDS);
    return JSBI.equal(JSBI.BigInt(one), JSBI.BigInt(two));
  }
  toString(optionsParam: Params['toString'][0] = undefined): string {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    const options = ES.GetOptionsObject(optionsParam);
    let timeZone = options.timeZone;
    if (timeZone !== undefined) timeZone = ES.ToTemporalTimeZone(timeZone);
    // Although TS doesn't acknowledge it, below here `timeZone` is a Temporal.TimeZoneProtocol
    const { precision, unit, increment } = ES.ToSecondsStringPrecision(options);
    const roundingMode = ES.ToTemporalRoundingMode(options, 'trunc');
    const ns = GetSlot(this, EPOCHNANOSECONDS);
    const roundedNs = ES.RoundInstant(ns, increment, unit, roundingMode);
    const roundedInstant = new Instant(roundedNs);
    return ES.TemporalInstantToString(roundedInstant, timeZone as Temporal.TimeZoneProtocol, precision);
  }
  toJSON(): string {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return ES.TemporalInstantToString(this, undefined, 'auto');
  }
  toLocaleString(
    locales: Params['toLocaleString'][0] = undefined,
    options: Params['toLocaleString'][1] = undefined
  ): string {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    return new DateTimeFormat(locales, options).format(this);
  }
  valueOf(): never {
    throw new TypeError('use compare() or equals() to compare Temporal.Instant');
  }
  toZonedDateTime(item: Params['toZonedDateTime'][0]): Return['toZonedDateTime'] {
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    if (!ES.IsObject(item)) {
      throw new TypeError('invalid argument in toZonedDateTime');
    }
    const calendarLike = item.calendar;
    if (calendarLike === undefined) {
      throw new TypeError('missing calendar property in toZonedDateTime');
    }
    const calendar = ES.ToTemporalCalendar(calendarLike);
    const temporalTimeZoneLike = item.timeZone;
    if (temporalTimeZoneLike === undefined) {
      throw new TypeError('missing timeZone property in toZonedDateTime');
    }
    const timeZone = ES.ToTemporalTimeZone(temporalTimeZoneLike);
    return ES.CreateTemporalZonedDateTime(GetSlot(this, EPOCHNANOSECONDS), timeZone, calendar);
  }
  toZonedDateTimeISO(itemParam: Params['toZonedDateTimeISO'][0]): Return['toZonedDateTimeISO'] {
    let item = itemParam;
    if (!ES.IsTemporalInstant(this)) throw new TypeError('invalid receiver');
    if (ES.IsObject(item)) {
      const timeZoneProperty = item.timeZone;
      if (timeZoneProperty !== undefined) {
        item = timeZoneProperty;
      }
    }
    const timeZone = ES.ToTemporalTimeZone(item as string | Temporal.TimeZoneProtocol);
    const calendar = ES.GetISO8601Calendar();
    return ES.CreateTemporalZonedDateTime(GetSlot(this, EPOCHNANOSECONDS), timeZone, calendar);
  }

  static fromEpochSeconds(epochSecondsParam: Params['fromEpochSeconds'][0]): Return['fromEpochSeconds'] {
    const epochSeconds = ES.ToNumber(epochSecondsParam);
    const epochNanoseconds = JSBI.multiply(JSBI.BigInt(epochSeconds), BILLION);
    ES.ValidateEpochNanoseconds(epochNanoseconds);
    return new Instant(epochNanoseconds);
  }
  static fromEpochMilliseconds(
    epochMillisecondsParam: Params['fromEpochMilliseconds'][0]
  ): Return['fromEpochMilliseconds'] {
    const epochMilliseconds = ES.ToNumber(epochMillisecondsParam);
    const epochNanoseconds = JSBI.multiply(JSBI.BigInt(epochMilliseconds), MILLION);
    ES.ValidateEpochNanoseconds(epochNanoseconds);
    return new Instant(epochNanoseconds);
  }
  static fromEpochMicroseconds(
    epochMicrosecondsParam: Params['fromEpochMicroseconds'][0]
  ): Return['fromEpochMicroseconds'] {
    const epochMicroseconds = ES.ToBigInt(epochMicrosecondsParam);
    const epochNanoseconds = JSBI.multiply(epochMicroseconds, THOUSAND);
    ES.ValidateEpochNanoseconds(epochNanoseconds);
    return new Instant(epochNanoseconds);
  }
  static fromEpochNanoseconds(
    epochNanosecondsParam: Params['fromEpochNanoseconds'][0]
  ): Return['fromEpochNanoseconds'] {
    const epochNanoseconds = ES.ToBigInt(epochNanosecondsParam);
    ES.ValidateEpochNanoseconds(epochNanoseconds);
    return new Instant(epochNanoseconds);
  }
  static from(item: Params['from'][0]): Return['from'] {
    if (ES.IsTemporalInstant(item)) {
      return new Instant(GetSlot(item, EPOCHNANOSECONDS));
    }
    return ES.ToTemporalInstant(item);
  }
  static compare(oneParam: Params['compare'][0], twoParam: Params['compare'][1]): Return['compare'] {
    const one = ES.ToTemporalInstant(oneParam);
    const two = ES.ToTemporalInstant(twoParam);
    const oneNs = GetSlot(one, EPOCHNANOSECONDS);
    const twoNs = GetSlot(two, EPOCHNANOSECONDS);
    if (JSBI.lessThan(oneNs, twoNs)) return -1;
    if (JSBI.greaterThan(oneNs, twoNs)) return 1;
    return 0;
  }
  [Symbol.toStringTag]!: 'Temporal.Instant';
}

MakeIntrinsicClass(Instant, 'Temporal.Instant');
