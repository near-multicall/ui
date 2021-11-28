export const initialData = {
    tasks: { 
        'task-i1': { id: 'task-i1', addr: "multicall.lennczar.testnet", func: "withdraw_from_ref" },
        'task-i2': { id: 'task-i2', addr: "", func: "" },
    },
    columns: {
        'column-0': {
            id: 'column-0',
            title: 'Drag here',
            taskIds: []
        },
        'menu': {
            id: 'menu',
            title: 'Infinite Column',
            taskIds: ['task-i1', 'task-i2']
        },
        'trash': {
            id: 'trash',
            title: 'Delete',
            taskIds: []
        }
    },
    columnOrder: ['column-0']
}