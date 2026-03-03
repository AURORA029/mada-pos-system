!macro customInstall
  DetailPrint "Configuration du réseau et du pare-feu Mada POS..."
  ExecWait 'netsh advfirewall firewall add rule name="Mada POS Server" dir=in action=allow protocol=TCP localport=5000'
!macroend

!macro customUnInstall
  DetailPrint "Nettoyage des règles du pare-feu..."
  ExecWait 'netsh advfirewall firewall delete rule name="Mada POS Server"'
!macroend
