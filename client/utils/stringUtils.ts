export function shortenString(str: string, length: number = 10): string {
	if (!str) return "";
	if (str.length <= length + 3) return str; // not long enough to shorten
	return `${str.slice(0, length)}...`;
}
