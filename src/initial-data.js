export const initialData = {
    tasks: { 
        'task-i1': { id: 'task-i1', addr: "multicall", func: "withdraw_from_ref" },
        'task-i2': { id: 'task-i2', addr: "multicall", func: "near_transfer" },
        'task-i3': { id: 'task-i3', addr: "near", func: "ft_transfer batch" },
        'task-i4': { id: 'task-i4', addr: "near", func: "ft_transfer"},
        'task-i5': { id: 'task-i5', addr: "near", func: "storage_deposit" },
        'task-i6': { id: 'task-i6', addr: "", func: "" },
    },
    columns: {
        'task-i3': { id: 'task-i3', title: 'Drag here', taskIds: ['task-i4'] },
        'column-0': {
            id: 'column-0',
            title: 'Drag here',
            taskIds: []
        },
        'menu': {
            id: 'menu',
            title: 'Infinite Column',
            taskIds: ['task-i5', 'task-i3', 'task-i2', 'task-i6']
        }
    },
    columnOrder: ['column-0']
}