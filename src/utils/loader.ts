window.onload = function(e) {
    window.STORAGE.load();
}

window.onbeforeunload = function(e) {
    window.STORAGE.save();

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

export function readFile(file: File, callback: (json: object) => any) {
    if (file.type !== "application/json") 
        return;

    let reader = new FileReader();
    reader.readAsText(file,'UTF-8');
  
    reader.onload = e_reader => callback(JSON.parse(e_reader?.target?.result as string));
}