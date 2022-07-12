export const initialData = {
    tasks: { 
        'task-i1': { id: 'task-i1', addr: "multicall", func: "withdraw_from_ref" },
        'task-i2': { id: 'task-i2', addr: "multicall", func: "near_transfer" },
        'task-i3': { id: 'task-i3', addr: "near", func: "ft_transfer" },
        'task-i4': { id: 'task-i4', addr: "near", func: "storage_deposit" },
        'task-i5': { id: 'task-i5', addr: "", func: "" },
        'task-i7': { id: 'task-i7', addr: "", func: "batch" },
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
            taskIds: ['task-i5', 'task-i4', 'task-i3', 'task-i2', 'task-i7']
        },
        'trash': {
            id: 'trash',
            title: 'Delete',
            taskIds: []
        },
        'task-i7': {
            id: 'task-i7',
            title: 'Drag here',
            taskIds: []
        }
    },
    columnOrder: ['column-0']
}