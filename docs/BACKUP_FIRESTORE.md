# Backup & recuperare Firestore — alumacontracte

## 1. Point-in-Time Recovery (PITR)
Permite restaurarea bazei la orice moment din ultimele 7 zile.

```
gcloud firestore databases update --project=alumacontracte --enable-pitr
```
(sau: Firebase Console → Firestore → Backups → activează PITR)

## 2. Backup programat (zilnic, retenție 7 zile)
```
gcloud firestore backups schedules create \
  --project=alumacontracte \
  --database="(default)" \
  --recurrence=daily \
  --retention=7d
```

Listare backup-uri:
```
gcloud firestore backups list --project=alumacontracte
```

## 3. Restaurare dintr-un backup
```
gcloud firestore databases restore \
  --project=alumacontracte \
  --source-backup=projects/alumacontracte/locations/<LOC>/backups/<BACKUP_ID> \
  --destination-database="restored-db"
```
Restaurarea creează o bază NOUĂ (nu suprascrie producția) — verifici, apoi comuți.

## 4. Recuperare contract șters (soft-delete)
Contractele șterse din aplicație rămân în colecția `drafturi` cu `deleted:true`.
Recuperare programatică: `restoreContract(id)` (în `src/shared/db.js`).
Ștergere definitivă doar explicit: `purgeContract(id)`.

> Notă: nu există pas de backup/PITR în CI. Se rulează manual, la nevoie.
