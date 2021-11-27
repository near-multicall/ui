export const initialData = {
    tasks: { 
        'task-i1': { id: 'task-i1', content: 'infinite-1' },
        'task-i2': { id: 'task-i2', content: 'infinite-2' },
        'task-i3': { id: 'task-i3', content: 'infinite-3' },
        'task-i4': { id: 'task-i4', content: 'infinite-4' },
        'task-i5': { id: 'task-i5', content: 'infinite-5' },
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
            taskIds: ['task-i1', 'task-i2', 'task-i3', 'task-i4', 'task-i5']
        },
        'trash': {
            id: 'trash',
            title: 'Delete',
            taskIds: []
        }
    },
    columnOrder: ['column-0']
}