package com.neurotwin.app.auth

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow

enum class Mode(val label: String) {
    PATIENT("Patient Mode"),
    CAREGIVER("Caregiver Mode");
}

data class Session(val mode: Mode? = null)

/**
 * One toggle, per the docs: "Single button switches between Patient Mode
 * (simple) and Caregiver Mode." No accounts — this is a family device.
 */
object AuthState {
    private val _session = MutableStateFlow(Session())
    val session: kotlinx.coroutines.flow.StateFlow<Session> = _session

    private var appContext: Context? = null

    fun rememberContext(context: Context) {
        appContext = context.applicationContext
        val p = context.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)
        val saved = p.getString("mode", null)
            ?.let { runCatching { Mode.valueOf(it) }.getOrNull() }
        if (saved != null) _session.value = Session(saved)
    }

    fun enter(mode: Mode) {
        _session.value = Session(mode)
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.putString("mode", mode.name)?.apply()
    }

    /** Back to the mode picker. */
    fun switchMode() {
        _session.value = Session(null)
        appContext?.getSharedPreferences("neurotwin_auth", Context.MODE_PRIVATE)?.edit()
            ?.remove("mode")?.apply()
    }
}
