package com.neurotwin.app.caregiver

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.neurotwin.app.data.*
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

/** Everything the caregiver shell needs, loaded live from the backend. */
class CaregiverViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = NeuroTwinRepository(app)

    var health by mutableStateOf<ApiResult<HealthStatus>?>(null); private set
    var people by mutableStateOf<ApiResult<List<Person>>?>(null); private set
    var memories by mutableStateOf<ApiResult<List<Memory>>?>(null); private set
    var medicines by mutableStateOf<ApiResult<List<Medicine>>?>(null); private set
    var contacts by mutableStateOf<ApiResult<List<EmergencyContact>>?>(null); private set

    /** Bumps to re-run derived stats. */
    var revision by mutableStateOf(0); private set

    fun refreshAll() {
        viewModelScope.launch {
            health = async { repo.health() }.await().also { revision++ }
            people = async { repo.people() }.await()
            memories = async { repo.memories() }.await()
            medicines = async { repo.medicines() }.await()
            contacts = async { repo.contacts() }.await()
            revision++
        }
    }

    fun refreshPeople() {
        viewModelScope.launch {
            people = repo.people(); revision++
        }
    }

    fun refreshMemories() {
        viewModelScope.launch {
            memories = repo.memories(); revision++
        }
    }

    fun refreshMedicines() {
        viewModelScope.launch {
            medicines = repo.medicines(); revision++
        }
    }

    fun refreshContacts() {
        viewModelScope.launch {
            contacts = repo.contacts(); revision++
        }
    }

    // ── Mutations (each refreshes its slice) ──

    fun addPerson(name: String, relationship: String, birthday: String?, onDone: (String?) -> Unit) {
        viewModelScope.launch {
            val r = repo.createPerson(name, relationship, birthday)
            if (r is ApiResult.Success) refreshPeople()
            onDone((r as? ApiResult.Failure)?.message)
        }
    }

    fun addPersonWithPhoto(
        name: String, relationship: String, birthday: String?,
        photoFile: java.io.File, onDone: (String?) -> Unit,
    ) {
        viewModelScope.launch {
            val r = repo.createPersonWithPhoto(name, relationship, birthday, photoFile)
            photoFile.delete()
            if (r is ApiResult.Success) refreshPeople()
            onDone((r as? ApiResult.Failure)?.message)
        }
    }

    fun deletePerson(id: String) {
        viewModelScope.launch { repo.deletePerson(id); refreshPeople() }
    }

    fun addMemory(title: String, description: String?, category: String, onDone: (String?) -> Unit) {
        viewModelScope.launch {
            val r = repo.createMemory(title, description, category)
            if (r is ApiResult.Success) refreshMemories()
            onDone((r as? ApiResult.Failure)?.message)
        }
    }

    fun deleteMemory(id: String) {
        viewModelScope.launch { repo.deleteMemory(id); refreshMemories() }
    }

    fun saveMedicine(m: Medicine, onDone: (String?) -> Unit) {
        viewModelScope.launch {
            val r = repo.saveMedicine(m)
            if (r is ApiResult.Success) refreshMedicines()
            onDone((r as? ApiResult.Failure)?.message)
        }
    }

    fun deleteMedicine(id: String) {
        viewModelScope.launch { repo.deleteMedicine(id); refreshMedicines() }
    }

    fun saveContact(c: EmergencyContact, onDone: (String?) -> Unit) {
        viewModelScope.launch {
            val r = repo.saveContact(c)
            if (r is ApiResult.Success) refreshContacts()
            onDone((r as? ApiResult.Failure)?.message)
        }
    }

    fun deleteContact(id: String) {
        viewModelScope.launch { repo.deleteContact(id); refreshContacts() }
    }
}
