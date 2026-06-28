# GarageFlow — Documents véhicule (conception V2)

> **État : NON implémenté en V1.** Aucun upload, aucun stockage de document n'existe encore. Ce document décrit la conception sécurisée à suivre **avant** d'activer cette fonctionnalité, parce qu'elle touche à des documents sensibles (carte grise, assurance…).

## Objectif
Permettre au client d'attacher des documents à un véhicule de son dossier, et d'en **partager certains** avec un garage, de façon **privée, explicite et révocable**.

## Types de documents visés
- Carte grise (certificat d'immatriculation)
- Attestation d'assurance
- Contrôle technique
- Factures / historique d'entretien
- Photos du véhicule
- Autres documents libres

## Principe directeur
**Privé par défaut.** Un document n'est visible que par son propriétaire, sauf partage explicite, document par document, avec un garage donné — et ce partage est révocable. **Jamais d'URL publique permanente.**

## Modèle de données proposé
Réutilise la table de consentement existante `client_vehicle_shares` (V1) pour les véhicules, et ajoute une table dédiée aux documents :

```sql
-- Métadonnées du document (le fichier vit dans un bucket privé)
create table public.client_vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  client_vehicle_id uuid not null references public.client_vehicles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,            -- 'carte_grise' | 'assurance' | 'controle_technique' | 'facture' | 'photo' | 'autre'
  title text,
  storage_path text not null,        -- chemin dans le bucket privé (jamais une URL publique)
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Partage explicite d'UN document avec UN garage (révocable)
create table public.client_vehicle_document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.client_vehicle_documents(id) on delete cascade,
  garage_id uuid not null references public.garages(id) on delete cascade,
  service_request_id uuid references public.service_requests(id) on delete set null,
  shared_by uuid not null references auth.users(id) on delete cascade,
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index uq_cvds_active
  on public.client_vehicle_document_shares(document_id, garage_id) where revoked_at is null;
```

## Règles de sécurité (obligatoires)
- **Bucket Supabase privé** (ex. `vehicle-docs`), **non public**, **sans listing**.
- **RLS stricte** sur `client_vehicle_documents` : `owner_id = auth.uid()` en lecture/écriture.
- **Accès garage** uniquement via un partage **actif** (`client_vehicle_document_shares` non révoqué) — même logique que `vehicle_shared_with_me()` en V1.
- **Pas d'URL publique permanente.** Accès au fichier via **URL signée à durée courte** (ex. 60–300 s), générée à la demande, uniquement si le demandeur a le droit (propriétaire ou partage actif).
- **Révocation** : poser `revoked_at` coupe immédiatement l'accès du garage (et invalide la génération de nouvelles URLs signées).
- **Suppression** : supprimer la ligne **et** l'objet de stockage (pas d'orphelin).
- **Politiques Storage** : policies sur le bucket alignées sur les tables (insert/select/delete par propriétaire ; select garage via partage actif), via une fonction `SECURITY DEFINER` de vérification.
- **Aucune clé `service_role` côté frontend.** La génération d'URL signée passe par une Edge Function sous le JWT de l'appelant (RLS appliquée) ou par le SDK côté client avec policies Storage.

## Limites légales / points de vigilance
- Documents **sensibles** (carte grise = données d'identité du véhicule/propriétaire) : minimiser, ne demander que si utile à la prestation.
- **Durée de conservation** à définir et à respecter ; suppression à la fin de la relation ou sur demande.
- **Traçabilité** des accès (qui a consulté quoi, quand) recommandée pour ce type de document.
- **Consentement** explicite et **révocable**, document par document (pas de partage global).
- Vérifier les **obligations d'archivage** (factures) vs droit à l'effacement.

## Étapes futures (ordre conseillé)
1. Créer le **bucket privé** + policies Storage minimales.
2. Migration `client_vehicle_documents` + `client_vehicle_document_shares` + RLS + helper d'accès.
3. **Upload** côté client (taille/MIME limités) → `storage_path` privé.
4. **Liste / suppression** des documents dans « Mes véhicules ».
5. **Partage par document** avec un garage (au fil d'une demande) + **révocation**.
6. **Lecture garage** via URL signée courte, uniquement si partage actif.
7. **Journalisation** des accès + écran d'historique.
8. Mise à jour `DATA_PRIVACY_NOTES.md` + politique de confidentialité.

> Tant que ces garde-fous ne sont pas en place, **ne pas activer l'upload**. La V1 se limite aux **informations** du véhicule (texte), déjà cloisonnées et partagées par consentement.
