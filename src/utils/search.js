const regexp = new RegExp('\\B\\#\\d\\d+\\b', 'g');

export const findIssueNumbers = function (searchText) {
    const result = searchText.match(regexp);
    if (result) {
        return result;
    } else {
        return [];
    }
};

