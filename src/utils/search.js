const regexp = new RegExp('\\B\\#\\d\\d+\\b', 'g');

/**
 * Get an array of issue numbers from a block of text by searching for #<number> pattern
 *
 * @param searchText
 * @return {*}
 */
export const findIssueNumbers = function (searchText) {
    const result = searchText.match(regexp);
    if (result) {
        return result;
    } else {
        return [];
    }
};

