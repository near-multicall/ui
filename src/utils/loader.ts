window.onbeforeunload = function (e) {
    e = e || window.event;

    // For IE and Firefox prior to version 4
    if (e) {
        e.returnValue = 'Sure?';
    }

    // For Safari
    return 'Sure?';
};

export function saveFile(name: string, data: any) {
    const element = document.createElement("a");
    const file = new Blob(data, {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = name; 
    element.click();
}