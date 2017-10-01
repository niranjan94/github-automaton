import { uniq } from 'lodash';

export class Detector {
  private static issueNumberRegExp = new RegExp('((?:issues)\\/(\\d+)|\\#\\d+)', 'g');
  private static emojiDetectionRegExp = new RegExp('(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]' +
    '|[\\u0023-\\u0039]\\ufe0f?\\u20e3|\\u3299|\\u3297|\\u303d|\\u3030|\\u24c2|\\ud83c[\\udd70-\\udd71]|\\ud83c[\\udd7e-\\udd7f]' +
    '|\\ud83c\\udd8e|\\ud83c[\\udd91-\\udd9a]|\\ud83c[\\udde6-\\uddff]|\\ud83c[\\ude01-\\ude02]|\\ud83c\\ude1a|\\ud83c\\ude2f' +
    '|\\ud83c[\\ude32-\\ude3a]|\\ud83c[\\ude50-\\ude51]|\\u203c|\\u2049|[\\u25aa-\\u25ab]|\\u25b6|\\u25c0|[\\u25fb-\\u25fe]' +
    '|\\u00a9|\\u00ae|\\u2122|\\u2139|\\ud83c\\udc04|[\\u2600-\\u26FF]|\\u2b05|\\u2b06|\\u2b07|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55' +
    '|\\u231a|\\u231b|\\u2328|\\u23cf|[\\u23e9-\\u23f3]|[\\u23f8-\\u23fa]|\\ud83c\\udccf|\\u2934|\\u2935|[\\u2190-\\u21ff])', 'g');
  private static issueMoveCommandRegExp = new RegExp(`@${process.env.BOT_USERNAME}(?:\\[bot\\])?\\s+move\\s+(?:to\\s+)?(.+\\/.+)`, 'i');

  /**
   * Get an array of issue numbers from a block of text by searching for #<number> pattern
   *
   * @param searchText
   * @return {string[]}
   */
  public static findIssueNumbers(searchText: string): string[] {
    let issueNumbers = searchText.match(Detector.issueNumberRegExp);
    issueNumbers = issueNumbers ? issueNumbers : [];
    return uniq(
      issueNumbers.map(
        (issueNumber) => issueNumber.toLowerCase().replace('issues/', '').replace('#', '').trim()
      )
    );
  }

  /**
   * Check if the comment contains only emoji
   *
   * @param comment {string}
   * @return {boolean}
   */
  public static hasOnlyEmoji(comment: string): boolean {
    return comment.replace(Detector.emojiDetectionRegExp, '').replace(/\s/g, 'X').trim() === '';
  }

  /**
   * Check if a comment actually makes any sense
   *
   * @param comment {string}
   * @return {boolean}
   */
  public static isInvalidComment(comment: string): boolean {
    comment = comment.trim();
    /**
     * Check if it is a simple +1/-1 comment
     */
    if (comment === '+1' || comment === '-1') {
      return true;
    }
    return Detector.hasOnlyEmoji(comment);
  }

  /**
   * Read comment and get issue move command if exists
   *
   * @param comment
   * @return {string|null}
   */
  public static getIssueMoveCommand(comment: string): string | null {
    const [, targetRepo] = comment.match(Detector.issueMoveCommandRegExp) || [null, null];
    return (targetRepo) ? targetRepo : null;
  }

  /**
   * Check if a label states anything similar to 'Do not merge'
   *
   * @param label
   * @return {boolean}
   */
  public static isDoNotMerge(label: string): boolean {
    label = label.toLowerCase();
    return label === 'do not merge' || label === 'do-not-merge' || label === 'wip' || label === 'w.i.p' || label === 'dont merge' || label === 'dont-merge';
  }
}
