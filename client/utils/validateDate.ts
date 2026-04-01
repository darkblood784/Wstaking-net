export const validateDate = (dateString: string) => {
    const newDate = new Date(dateString);
    if (isNaN(newDate.getTime())) {
        return false;
    }
    return true;
}