# Copyright (C) 2022 -  Juergen Zimmermann, Hochschule Karlsruhe
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\kubescape.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'kubescape'

# https://github.com/zegl/kube-score
$release = 'kunde'
Set-Location ..\helm
helm template $release . -f values.yaml -f dev.yaml > ${env:TEMP}\$release.yaml
C:\Zimmermann\kubescape\kubescape.exe scan --enable-host-scan --verbose C:/temp/$release.yaml
Set-Location ..\kubernetes
