import { MOCK_PATIENT } from '../context/AppStateContext'

export class PatientRepository {
  async findById(patientId: string) {
    // In production: return prisma.patientProfile.findUnique({ where: { id: patientId } })
    return {
      id: patientId || 'pt-001',
      name: MOCK_PATIENT.name,
      age: MOCK_PATIENT.age,
      conditionStage: MOCK_PATIENT.condition,
      location: MOCK_PATIENT.location,
      primaryCaregiver: MOCK_PATIENT.primaryCaregiver,
      caregiverPhone: MOCK_PATIENT.caregiverPhone,
      avatarUrl: MOCK_PATIENT.avatar,
      cognitiveScore: 78,
      riskLevel: 'LOW',
    }
  }

  async findAllForCaregiver(caregiverId: string) {
    return [
      {
        id: 'pt-001',
        name: 'Eleanor Vance',
        age: 78,
        conditionStage: 'Early Stage Alzheimer\'s (Stage 2)',
        location: 'Cedar Heights Residence, Room 304',
        primaryCaregiver: 'Sarah Vance (Daughter)',
        cognitiveScore: 78,
        status: 'Active',
      },
      {
        id: 'pt-002',
        name: 'Arthur Pendelton',
        age: 82,
        conditionStage: 'Vascular Dementia (Stage 3)',
        location: 'Oakridge Memory Care, Wing B',
        primaryCaregiver: 'Robert Pendelton (Son)',
        cognitiveScore: 64,
        status: 'Needs Attention',
      },
    ]
  }
}

export const patientRepository = new PatientRepository()
