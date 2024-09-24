Set objShell = CreateObject("WScript.Shell")

' Define you paths here
backendPath = "C:\path\to\backend"
frontendPath = "C:\path\to\frontend"

objShell.Run "cmd /k cd /d " & backendPath & " && npm run dev"
WScript.Sleep 2000
objShell.Run "cmd /k cd /d " & frontendPath & " && npm run dev"
