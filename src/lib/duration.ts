type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
type PluralTimeUnit = TimeUnit | `${TimeUnit}s`;
type DurationString = `${number} ${PluralTimeUnit}`;

class Duration {
  private static units: Record<TimeUnit, number> = {
    millisecond: 1,
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    week: 1000 * 60 * 60 * 24 * 7,
    month: 1000 * 60 * 60 * 24 * 30, // approximate
    year: 1000 * 60 * 60 * 24 * 365 // approximate
  };

  /**
   * Convert duration string to milliseconds
   * @example Duration.from('2 weeks') → 1209600000
   */
  static from(durationStr: DurationString): number {
    const [amountStr, unitStr] = durationStr.split(' ') as [string, PluralTimeUnit];
    const amount = parseFloat(amountStr);
    const unit = unitStr.replace(/s$/, '') as TimeUnit;
    
    if (!(unit in Duration.units)) {
      throw new Error(`Unknown time unit: ${unit}`);
    }
    
    return amount * Duration.units[unit];
  }

  /**
   * Convert milliseconds to duration string
   * @param ms - Milliseconds or Date (will be converted to ms since epoch)
   * @param preferredUnit - Specific time unit or 'auto' to choose best unit
   * @example Duration.to(1209600000) → "2 weeks"
   * @example Duration.to(new Date(), 'year') → "53 years" (since epoch)
   */
  static to(
    input: number | Date,
    preferredUnit: 'auto' | TimeUnit = 'auto'
  ): `${number} ${PluralTimeUnit}` {
    const ms = input instanceof Date ? input.getTime() : input;
    
    if (preferredUnit !== 'auto') {
      const value = ms / Duration.units[preferredUnit];
      const roundedValue = Math.round(value * 100) / 100;
      const plural = Math.abs(roundedValue) !== 1 ? 's' : '';
      return `${roundedValue} ${preferredUnit}${plural}` as const;
    }

    const absMs = Math.abs(ms);
    const entries = Object.entries(Duration.units) as [TimeUnit, number][];
    
    // Find the most appropriate unit
    const [unit] = entries
      .sort((a, b) => b[1] - a[1])
      .find(([_, unitMs]) => absMs >= unitMs) || ['millisecond', 1];

    const value = ms / Duration.units[unit];
    const roundedValue = Math.round(value * 100) / 100;
    const plural = Math.abs(roundedValue) !== 1 ? 's' : '';
    
    return `${roundedValue} ${unit}${plural}` as const;
  }
}