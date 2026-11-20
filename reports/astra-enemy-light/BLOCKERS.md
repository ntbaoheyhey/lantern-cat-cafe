No open project blockers at setup.
- Setup: the shell exited before the background install wrote any log or installed dependencies. Restarted it in a detached tool session with the same command and log. The system Python lacked PIL and the bundled Python lacked SciPy. Image tools use a separate environment.
