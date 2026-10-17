$ErrorActionPreference = 'Stop'
$repo = 'robertmarvin72/icelandic-weather'
$projectId = 'PVT_kwHOBOOf0s4BG3k1'
$statusField = 'PVTSSF_lAHOBOOf0s4BG3k1zg3yiZ4'
$priorityField = 'PVTSSF_lAHOBOOf0s4BG3k1zhads-I'
$priorityOptions = @{ P0='04d530dc'; P1='0caad89f'; P2='e6351412' }
$outDir = Join-Path $PSScriptRoot 'expert-support-2026-10-14-published'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$logPath = Join-Path $outDir 'issues.json'
$records = [System.Collections.Generic.List[object]]::new()
if (Test-Path -LiteralPath $logPath) { foreach ($entry in (Get-Content $logPath -Raw | ConvertFrom-Json)) { $records.Add($entry) } }
function Invoke-Gh([string[]]$Arguments) {
  $result = & gh @Arguments
  if ($LASTEXITCODE -ne 0) { throw "gh failed: $($Arguments[0..([Math]::Min(2,$Arguments.Length-1))] -join ' ')" }
  return ($result -join "`n")
}
function Save-Log { ConvertTo-Json -InputObject @($records.ToArray()) -Depth 8 | Set-Content -LiteralPath $logPath -Encoding utf8 }
$labels = Invoke-Gh @('label','list','--repo',$repo,'--limit','100','--json','name') | ConvertFrom-Json
foreach ($label in @('expert-support','vedurstofan-2026-10-14')) {
  if ($label -notin $labels.name) {
    $description = if ($label -eq 'expert-support') { 'Tasks informed by expert-support feedback; not institutional endorsement.' } else { 'Expert Support meeting with Gudrun Nina Petersen, 2026-10-14.' }
    Invoke-Gh @('label','create',$label,'--repo',$repo,'--color','1D76DB','--description',$description) | Out-Null
    Write-Output "Label created: $label"
  }
}
$proposal = Get-Content (Join-Path $PSScriptRoot 'expert-support-2026-10-14-proposal.md') -Raw
$sourceNotice = 'Heimild: Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026; fundarúrdráttur afhentur af eiganda. Athugasemdir eru endursagnir úr úrdrætti, ekki orðréttar tilvitnanir. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.'
$guard = 'Engar scoring-, veðurfræðilegar þröskulda- eða gagnagjafabreytingar án rannsóknar og sérstakrar samþykktrar útfærslu. Þessi miði heimilar ekki sjálfkrafa provider-skipti eða nýtt áhættulíkan.'
$allIssues = Invoke-Gh @('issue','list','--repo',$repo,'--state','all','--limit','1000','--json','number,title') | ConvertFrom-Json
$definitions = [System.Collections.Generic.List[object]]::new()
foreach ($match in [regex]::Matches($proposal,'(?ms)^## (N\d+) — (.*?) — (P[012])\r?\n(.*?)(?=^## |\z)')) {
  $key=$match.Groups[1].Value; $title=$match.Groups[2].Value; $priority=$match.Groups[3].Value
  if ($key -eq 'N5') { $priority='P0' }
  $raw=$match.Groups[4].Value.Trim()
  $paragraphs=$raw -split '\r?\n\r?\n',2
  $rest=$paragraphs[1]
  $acIndex=$rest.IndexOf('Acceptance:')
  $testIndex=$rest.IndexOf('Prófun:')
  if ($acIndex -lt 0 -or $testIndex -le $acIndex) { throw "Missing AC/test: $key" }
  $implementation=$rest.Substring(0,$acIndex).Trim()
  $acceptance=$rest.Substring($acIndex+11,$testIndex-$acIndex-11).Trim()
  $tests=$rest.Substring($testIndex+8).Trim()
  $body = "## Tilgangur og vandamál`n`n$title. Markmiðið er að bregðast við eftirfarandi fundarathugasemd innan afmarkaðs umfangs, með yfirferð núverandi útfærslu áður en breyting er ákveðin.`n`n## Heimild og athugasemd úr fundarúrdrætti`n`n$sourceNotice`n`n$($paragraphs[0])`n`n## Okkar tillaga að útfærslu`n`n$implementation`n`n## Acceptance criteria`n`n$acceptance`n`n## Prófunarkröfur og tengdir eldri miðar`n`n$tests`n`n## Forgangur og mörk`n`n$priority · Project #3 · Todo.`n`n$guard"
  $definitions.Add([pscustomobject]@{key=$key;title=$title;priority=$priority;body=$body})
}
$researchBody = @'
## Tilgangur og vandamál

Rannsaka gagnaveitur fyrir allt Eltum Veðrið: núverandi Open-Meteo-líkön, íslensk/staðbundin veðurlíkön, DMI/IG og veðurathuganir. Áður en ákvörðun er tekin um breytingar þarf að vita hvaðan hver stærð kemur, hvort hún er athugun eða spá, og hvort gögnin henta staðsetningu, hæð og tímaglugga.

## Heimild og athugasemdir úr fundarúrdrætti

Expert Support fundur með Guðrúnu Nínu Petersen hjá Veðurstofu Íslands, 14. október 2026. Heimild er úrdráttur eiganda, ekki staðfest orðrétt afrit. Fundurinn er ekki formleg staðfesting Veðurstofunnar á líkani Eltum Veðrið.

- Upphaf (án tímastimpils): spurning um gagnalíkan frá Open-Meteo; setningin í úrdrætti er ófullgerð og er ekki fyllt út með ágiskun.
- 42:40: hvaða gögn liggja að baki?
- 43:30: athuganir lýsa núverandi mælingum; DMI nefnt sem möguleg spágagnaveita.
- 45:00: tillaga um íslenskar spár/líkön fyrstu þrjá daga.
- 45:40: líkan nefnt „IG“, hæðarleiðrétting og reiknipunktar í þröngum fjörðum rædd.
- 48:14: kanna athuganir fyrir núverandi veður og DMI fyrir framtíðarspár.

## Okkar tillaga að rannsókn

1. Kortleggja gagnasamninga og raunverulegt model-selection í núverandi Eltum Veðrið, með afmörkun eftir virkni. Ekki gera ráð fyrir að allar veðurstærðir/notkun tilheyri sama líkani.
2. Staðfesta heiti, aðgengi, leyfi, quota, Íslandsdekkingu, upplausn, hæð/landslagsmeðhöndlun, refresh og spálengd DMI/IG/íslenskra líkansgagna með heimildum. Fundarheitið „IG“ og fyrstu þrír dagar eru rannsóknarspurningar, ekki fyrirfram samþykkt provider-val.
3. Aðgreina athuganir frá líkanaspá og kanna stöðvafjarlægð, mælihæð, tímastimpla, gæðaflögg, einingar og úreldingu fyrir núverandi veður.
4. Bera saman aðgengilega gagnasamninga/dæmi fyrir fjörð, sjávarmál, hálendi og ólíka landshluta. Án mæligagnavalidation má ekki kalla mun milli tveggja spáveita sönnun fyrir nákvæmni.
5. Skila gagnaveitufylki, óvissu/takmörkunum og GO/PARTIAL/NO-GO tillögu að síðari breytingum fyrir allt appið. Afmarka sérstaklega hvernig niðurstöður nýtast Winter Route Advisor #429 og Ski Weather #419.

Gagnaveitur til könnunar: https://athuganir.vedur.is/ og https://www.dmi.dk/frie-data . Almenn DMI-gagnasíða ein og sér staðfestir ekki að umrædd IG-gögn séu tiltæk fyrir Ísland.

## Acceptance criteria

- Núverandi veðurstærðir, providers og model-selection hafa verið kortlögð með kóðatilvísunum, án leyndarmála.
- Athuganir/spá og gæði/freshness/stöðva- og reiknipunktaforsendur eru aðgreind.
- Aðgengi/heiti/Íslandsdekking/hæðarmeðhöndlun DMI/IG hafa verið staðfest eða merkt óstaðfest með ástæðu.
- Fyrstu 0–72 klst og lengri spágluggar hafa sérstakt mat; engin ný 72h-regla innleidd.
- Heimildastudd fylki, dæmi, óvissa og tillaga að áframhaldi eru afhent.
- #429 tengist almennu rannsókninni en heldur sínu route-/vetrarsértæka umfangi.

## Prófunarkröfur

Read-only gagnasýnishorn með tímum/einingum/landfræðilegri coverage; dæmi við mismunandi hæð og fjörð/reiknipunkt; missing/stale data; staðfesta samninga við núverandi normalization án innleiðingar. Ef raunveruleg gögn eru óaðgengileg skal segja það og ekki búa til staðfestingarkröfur úr ágiskun.

## Forgangur, tengsl og mörk

P1 · Project #3 · Todo. Þessi app-wide rannsókn er aðgreind frá route-specific MVP discovery #429 og Ski Weather #419; niðurstöður endurnýttar milli þeirra, ekki tvöfaldar rannsóknir. Tengist eldri source-skýringu #170.

Engar kóðabreytingar, scoring-/þröskuldabreytingar, gagnaveituskipti, production-gagnabreytingar eða nýtt líkan innleitt í þessum rannsóknarmiða. Innleiðing bíður rannsókna og sérstakrar samþykktar.
'@
$definitions.Add([pscustomobject]@{key='N15';title='Rannsókn: Open-Meteo, DMI/IG, íslensk veðurlíkön og athuganir fyrir allt Eltum Veðrið';priority='P1';body=$researchBody})
if ($definitions.Count -ne 15) { throw "Expected 15 definitions, got $($definitions.Count)" }
foreach ($definition in $definitions) {
  $record = $records | Where-Object key -eq $definition.key | Select-Object -First 1
  if (-not $record) {
    $existing = @($allIssues | Where-Object title -eq $definition.title)
    if ($existing.Count -gt 0) { throw "Matching existing title; review before creating: $($definition.title)" }
    $bodyFile = Join-Path $outDir ($definition.key + '.md')
    Set-Content -LiteralPath $bodyFile -Value $definition.body -Encoding utf8
    $url = Invoke-Gh @('issue','create','--repo',$repo,'--title',$definition.title,'--body-file',$bodyFile,'--label','expert-support','--label','vedurstofan-2026-10-14')
    if ($url -notmatch '/issues/(\d+)') { throw "Unexpected issue result: $url" }
    $record = [pscustomobject]@{key=$definition.key;number=[int]$Matches[1];url=$url.Trim();title=$definition.title;priority=$definition.priority;status='Pending project';itemId=$null}
    $records.Add($record); Save-Log
    Write-Output "Created $($definition.key): #$($record.number)"
  }
  if (-not $record.itemId) {
    $item = Invoke-Gh @('project','item-add','3','--owner','robertmarvin72','--url',$record.url,'--format','json') | ConvertFrom-Json
    $record.itemId=$item.id; Save-Log
  }
  Invoke-Gh @('project','item-edit','--id',$record.itemId,'--project-id',$projectId,'--field-id',$statusField,'--single-select-option-id','ea6f10b7') | Out-Null
  Invoke-Gh @('project','item-edit','--id',$record.itemId,'--project-id',$projectId,'--field-id',$priorityField,'--single-select-option-id',$priorityOptions[$record.priority]) | Out-Null
  $record.status='Todo'; Save-Log
  Write-Output "Project verified write: #$($record.number) $($record.priority) Todo"
}
$research = $records | Where-Object key -eq 'N15'
$marker='## Expert Support — fundur 2026-10-14'
foreach ($number in @(429,419,329)) {
  $issue = Invoke-Gh @('issue','view',"$number",'--repo',$repo,'--json','body,title,url') | ConvertFrom-Json
  if (-not $issue.body.Contains($marker)) {
    if ($number -eq 429) {
      $addition = "$marker`n`n$sourceNotice`n`n### Tengd almenn gagnaveiturannsókn`n`nAlmenn rannsókn fyrir ALLT Eltum Veðrið er $($research.url) (#$($research.number), P1). Endurnýta staðfestar niðurstöður hennar um Open-Meteo/DMI/IG/íslensk líkön og athuganir; ekki tvöfalda þá rannsókn hér.`n`n### Athugasemdir úr fundi`n`n42:40–48:14: gagnauppruni, athuganir vs spá, fyrstu þrír dagar, hæðarmunur og staðsetning reiknipunkta.`n`n### Okkar vetrarráðgjafa-sértæka viðbót`n`nMeta hvernig þessi gögn tengjast leiðarköflum/checkpoints, fjallvegum/fjörðum, ferðatíma og gagnadekkingu næstu 24–48 klst. Aðgreina mælingar/spá/opinberar viðvaranir/vegaupplýsingar/eigin mat. Fyrstu þrír dagar og IG eru rannsóknarspurningar, ekki ný provider-regla.`n`n### Acceptance criteria og prófun`n`n- Gagnaveitufylki og GO/PARTIAL/NO-GO endurnýta heimildir úr #$($research.number).`n- Route-sértækar takmarkanir á stöðvafjarlægð, hæð, uppfærslutíma og úreldingu skráðar.`n- Read-only dæmi á núverandi þremur prófunarleiðum í #429, þ.m.t. vantar/úrelt gögn, sýna hvort niðurstaða nýtist leiðargreiningu.`n- Engin route/risk scoring eða framleiðsluinnleiðing í þessari rannsókn.`n`nP0 / In Progress haldast; fyrra umfang og rannsóknarreglur miðans standa. $guard"
    } else {
      $key = if ($number -eq 419) { 'U2' } else { 'U3' }
      $m=[regex]::Match($proposal,"(?ms)^## $key — .*?\r?\n(.*?)(?=^## |\z)")
      if (-not $m.Success) { throw "Missing update $key" }
      $addition="$marker`n`n$sourceNotice`n`n### Afmörkuð viðbót (athugasemdir og okkar tillaga aðgreind)`n`n$($m.Groups[1].Value.Trim())`n`n$guard"
      if ($number -eq 419) { $addition += "`n`nTengd app-wide gagnaveiturannsókn: $($research.url). Snjódýptarhluti Ski Weather heldur sértæku discovery-umfangi sínu." }
    }
    $updateFile=Join-Path $outDir ("update-$number.md")
    Set-Content -LiteralPath $updateFile -Value ($issue.body + "`n`n---`n`n" + $addition) -Encoding utf8
    Invoke-Gh @('issue','edit',"$number",'--repo',$repo,'--body-file',$updateFile,'--add-label','expert-support','--add-label','vedurstofan-2026-10-14') | Out-Null
    Write-Output "Updated existing #$number (original body preserved)"
  }
}
Write-Output "Completed 15 new issues and 3 existing issue updates. Log: $logPath"
