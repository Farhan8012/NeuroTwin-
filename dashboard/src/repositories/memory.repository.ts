export class MemoryRepository {
  async findByPatientId(patientId: string, category?: string) {
    const allMemories = [
      {
        id: 'mem-101',
        title: 'Summer Lake Cabin with Family',
        category: 'TRAVEL',
        description: 'Family trip to Lake Tahoe in July 1974. Thomas cooked grilled trout while Sarah caught her first fish.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        contributor: 'Sarah Vance',
        year: '1974',
        audioLength: '1:15',
      },
      {
        id: 'mem-102',
        title: 'Chopin Nocturne in E-Flat',
        category: 'MUSIC',
        description: 'Eleanor played this piece at her university recital in 1968. Evokes deep calm and positive emotion.',
        image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=600&q=80',
        contributor: 'David Vance',
        year: '1968',
        audioLength: '2:40',
      },
      {
        id: 'mem-103',
        title: 'Wedding Anniversary in Paris',
        category: 'MILESTONES',
        description: 'Thomas and Eleanor celebrated 25th anniversary at Eiffel Tower restaurant in 1995.',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
        contributor: 'Sarah Vance',
        year: '1995',
      },
    ]

    if (category && category !== 'ALL') {
      return allMemories.filter((m) => m.category === category.toUpperCase())
    }
    return allMemories
  }

  async create(data: any) {
    return {
      id: `mem-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    }
  }
}

export const memoryRepository = new MemoryRepository()
