package com.neurotwin.app.auth

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

enum class Mode(val label: String) {
    PATIENT("Patient Mode"),
    CAREGIVER("Caregiver Mode");
}

data class Session(
    val mode: Mode? = null,
    val isLoggedIn: Boolean = false,
    val phone: String = "",
    val userName: String = "",
    val email: String = "",
    val bio: String = "",
    val avatarUri: String? = null
)

/**
 * Authentication and Session state manager for NeuroTwin.
 * Stores user login status, active profile, avatar URI, email, and operational mode.
 */
object AuthState {
    private val _session = MutableStateFlow(Session())
    val session: StateFlow<Session> = _session

    private var appContext: Context? = null

    fun rememberContext(context: Context) {
        appContext = context.applicationContext
        val p = context.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)
        val savedMode = p.getString("mode", null)
            ?.let { runCatching { Mode.valueOf(it) }.getOrNull() }
        val isLoggedIn = p.getBoolean("is_logged_in", false)
        val phone = p.getString("phone", "+91 98765 43210") ?: "+91 98765 43210"
        val userName = p.getString("user_name", "Farhan") ?: "Farhan"
        val email = p.getString("email", "farhan@neurotwin.ai") ?: "farhan@neurotwin.ai"
        val bio = p.getString("bio", "NeuroTwin Companion User") ?: "NeuroTwin Companion User"
        val avatarUri = p.getString("avatar_uri", null)

        if (isLoggedIn || savedMode != null) {
            _session.value = Session(
                mode = savedMode ?: Mode.PATIENT,
                isLoggedIn = isLoggedIn,
                phone = phone,
                userName = userName,
                email = email,
                bio = bio,
                avatarUri = avatarUri
            )
        }
    }

    fun completeAuth(phone: String, userName: String, mode: Mode, email: String = "", avatarUri: String? = null) {
        val finalEmail = if (email.isNotBlank()) email else (_session.value.email.ifBlank { "farhan@neurotwin.ai" })
        val finalAvatar = avatarUri ?: _session.value.avatarUri
        _session.value = Session(
            mode = mode,
            isLoggedIn = true,
            phone = phone,
            userName = userName.ifBlank { "Farhan" },
            email = finalEmail,
            bio = _session.value.bio.ifBlank { "NeuroTwin Companion User" },
            avatarUri = finalAvatar
        )
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.putBoolean("is_logged_in", true)
            ?.putString("phone", phone)
            ?.putString("user_name", userName)
            ?.putString("email", finalEmail)
            ?.putString("mode", mode.name)
            ?.putString("avatar_uri", finalAvatar)
            ?.apply()
    }

    fun updateProfile(userName: String, email: String, phone: String, mode: Mode, bio: String = "", avatarUri: String? = null) {
        val curr = _session.value
        val finalAvatar = avatarUri ?: curr.avatarUri
        _session.value = curr.copy(
            userName = userName,
            email = email,
            phone = phone,
            mode = mode,
            bio = bio,
            avatarUri = finalAvatar
        )
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.putString("user_name", userName)
            ?.putString("email", email)
            ?.putString("phone", phone)
            ?.putString("mode", mode.name)
            ?.putString("bio", bio)
            ?.putString("avatar_uri", finalAvatar)
            ?.apply()
    }

    fun enter(mode: Mode) {
        val curr = _session.value
        _session.value = curr.copy(mode = mode, isLoggedIn = true)
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.putString("mode", mode.name)
            ?.putBoolean("is_logged_in", true)
            ?.apply()
    }

    fun switchMode() {
        val curr = _session.value
        _session.value = curr.copy(mode = null)
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.remove("mode")
            ?.apply()
    }

    fun logout() {
        _session.value = Session()
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.clear()
            ?.apply()
    }
}
