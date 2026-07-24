-- Align the private registry with the complete canonical document model.
-- Only non-effective staged metadata is corrected. No legal acceptance,
-- historical document, effective version or effective date is changed.

with canonical_hashes (document_id, document_version, language, sha256) as (
  values
    ('legal', 'legal-2026-01', 'fr', 'b7e27190aa61dc35b44bb5b28964d35c71fce20c719725920c53d06375f5d501'),
    ('legal', 'legal-2026-01', 'en', '869fd4006e2cc5ab3dab293515571a65cbf37d488f0be711b90242624d142f99'),
    ('legal', 'legal-2026-01', 'ar', '871778353dfe8840cedd206103efa684903a0e17f943278ea54cdbffc4f49a0b'),
    ('terms_pro', 'terms-2026-01', 'fr', 'bfb31cbfcb840155475d8ae6ad236893730de4558d1a3564143b4097dcadf170'),
    ('terms_pro', 'terms-2026-01', 'en', 'b1e9e013d85d1c6d38f15b3bc8aae3e1953a472040b130fa6dac41dbff3c561c'),
    ('terms_pro', 'terms-2026-01', 'ar', 'a98b4bd3d0a8a5f46c4744efe3417dcf6e8634a99d519e36652c975e8c77406a'),
    ('terms_client', 'terms-2026-01', 'fr', '75148cb8161fa94a561ce55528d2fd9184ea2ad91f5e3a8619016f38fc6d31a7'),
    ('terms_client', 'terms-2026-01', 'en', '5b39b4616de703e7bc61f909da31dce3ce08110ed1d91d3a9aea6e063e58973d'),
    ('terms_client', 'terms-2026-01', 'ar', 'e8550f85fca2c8739096436606a6f136b3618d600988e8551c907b81e85fbcd4'),
    ('privacy', 'privacy-2026-01', 'fr', '46195d8d3529233cb44f8a0baafb7c23d98bedea7164564d310e100860844883'),
    ('privacy', 'privacy-2026-01', 'en', '96e2412d94aae83fb3e7abf20ca556ded21a2f8c1f7a67ae24d13ba2c6402145'),
    ('privacy', 'privacy-2026-01', 'ar', 'd9027874464a02d608dd879a89a74335bee7fdf88dc17595f1bf50156808dccb'),
    ('cookies', 'cookies-2026-01', 'fr', 'f9b08d5a61f7148bed5d71cc5543fd066720e08575a782a4bc92ae5dbe0e7edc'),
    ('cookies', 'cookies-2026-01', 'en', '9023e0f01e72c6478d33f7e38d9747961859d3bed0ff4b55ff09d67fc526d487'),
    ('cookies', 'cookies-2026-01', 'ar', '399121f003b970e3abe0a40a4644b519530049ad19cdd071e0635a6f9d35a319'),
    ('dpa', 'dpa-2026-01', 'fr', '484d5bba3263046198fb04b4326b1b683a66c386d21dc26f1ce937dc17878120'),
    ('dpa', 'dpa-2026-01', 'en', 'b2628e3c6ba4e4c82fa79976d09a0903d6f5cfb5ec769bd66d4384ca4f6b50c0'),
    ('dpa', 'dpa-2026-01', 'ar', '2b08bb7db0646c91d88a3afe3f2ff73674c0097ad8fee75b03ab6baf19cd3aec'),
    ('subprocessors', 'subprocessors-2026-01', 'fr', '04cb62ac1c520547e7d57ebb1b935436ddcdd7e93723f8d44985c7bfa916e177'),
    ('subprocessors', 'subprocessors-2026-01', 'en', '274b845ddff55ce06b64d06779692cdc28506bd875b45797471e7acced931935'),
    ('subprocessors', 'subprocessors-2026-01', 'ar', '805bf3d3ee2d7d1ea331f44dbff8f81da8f57bf522b28c9815301445c4ab950e'),
    ('security', 'security-2026-01', 'fr', '010e9cfca7ee955340cd22616947892cee19c907263038a9d52977e8328359d2'),
    ('security', 'security-2026-01', 'en', 'c37c73a0c2f721b98d051da43d88473a960f0016cfed4668f24a82fac0bf6d07'),
    ('security', 'security-2026-01', 'ar', 'f08517c191a14055f49a11681bb11cee9854cf85d3a0bac3d0842fe9daafd9e4')
)
update private.legal_document_versions document
set sha256 = canonical.sha256
from canonical_hashes canonical
where document.document_id = canonical.document_id
  and document.document_version = canonical.document_version
  and document.language = canonical.language
  and document.status in ('staged', 'draft')
  and document.effective_at is null
  and document.sha256 <> canonical.sha256;

do $$
declare
  v_mismatch_count integer;
begin
  with canonical_hashes (document_id, document_version, language, sha256) as (
    values
      ('legal', 'legal-2026-01', 'fr', 'b7e27190aa61dc35b44bb5b28964d35c71fce20c719725920c53d06375f5d501'),
      ('legal', 'legal-2026-01', 'en', '869fd4006e2cc5ab3dab293515571a65cbf37d488f0be711b90242624d142f99'),
      ('legal', 'legal-2026-01', 'ar', '871778353dfe8840cedd206103efa684903a0e17f943278ea54cdbffc4f49a0b'),
      ('terms_pro', 'terms-2026-01', 'fr', 'bfb31cbfcb840155475d8ae6ad236893730de4558d1a3564143b4097dcadf170'),
      ('terms_pro', 'terms-2026-01', 'en', 'b1e9e013d85d1c6d38f15b3bc8aae3e1953a472040b130fa6dac41dbff3c561c'),
      ('terms_pro', 'terms-2026-01', 'ar', 'a98b4bd3d0a8a5f46c4744efe3417dcf6e8634a99d519e36652c975e8c77406a'),
      ('terms_client', 'terms-2026-01', 'fr', '75148cb8161fa94a561ce55528d2fd9184ea2ad91f5e3a8619016f38fc6d31a7'),
      ('terms_client', 'terms-2026-01', 'en', '5b39b4616de703e7bc61f909da31dce3ce08110ed1d91d3a9aea6e063e58973d'),
      ('terms_client', 'terms-2026-01', 'ar', 'e8550f85fca2c8739096436606a6f136b3618d600988e8551c907b81e85fbcd4'),
      ('privacy', 'privacy-2026-01', 'fr', '46195d8d3529233cb44f8a0baafb7c23d98bedea7164564d310e100860844883'),
      ('privacy', 'privacy-2026-01', 'en', '96e2412d94aae83fb3e7abf20ca556ded21a2f8c1f7a67ae24d13ba2c6402145'),
      ('privacy', 'privacy-2026-01', 'ar', 'd9027874464a02d608dd879a89a74335bee7fdf88dc17595f1bf50156808dccb'),
      ('cookies', 'cookies-2026-01', 'fr', 'f9b08d5a61f7148bed5d71cc5543fd066720e08575a782a4bc92ae5dbe0e7edc'),
      ('cookies', 'cookies-2026-01', 'en', '9023e0f01e72c6478d33f7e38d9747961859d3bed0ff4b55ff09d67fc526d487'),
      ('cookies', 'cookies-2026-01', 'ar', '399121f003b970e3abe0a40a4644b519530049ad19cdd071e0635a6f9d35a319'),
      ('dpa', 'dpa-2026-01', 'fr', '484d5bba3263046198fb04b4326b1b683a66c386d21dc26f1ce937dc17878120'),
      ('dpa', 'dpa-2026-01', 'en', 'b2628e3c6ba4e4c82fa79976d09a0903d6f5cfb5ec769bd66d4384ca4f6b50c0'),
      ('dpa', 'dpa-2026-01', 'ar', '2b08bb7db0646c91d88a3afe3f2ff73674c0097ad8fee75b03ab6baf19cd3aec'),
      ('subprocessors', 'subprocessors-2026-01', 'fr', '04cb62ac1c520547e7d57ebb1b935436ddcdd7e93723f8d44985c7bfa916e177'),
      ('subprocessors', 'subprocessors-2026-01', 'en', '274b845ddff55ce06b64d06779692cdc28506bd875b45797471e7acced931935'),
      ('subprocessors', 'subprocessors-2026-01', 'ar', '805bf3d3ee2d7d1ea331f44dbff8f81da8f57bf522b28c9815301445c4ab950e'),
      ('security', 'security-2026-01', 'fr', '010e9cfca7ee955340cd22616947892cee19c907263038a9d52977e8328359d2'),
      ('security', 'security-2026-01', 'en', 'c37c73a0c2f721b98d051da43d88473a960f0016cfed4668f24a82fac0bf6d07'),
      ('security', 'security-2026-01', 'ar', 'f08517c191a14055f49a11681bb11cee9854cf85d3a0bac3d0842fe9daafd9e4')
  )
  select count(*)
  into v_mismatch_count
  from canonical_hashes canonical
  left join private.legal_document_versions document
    on document.document_id = canonical.document_id
    and document.document_version = canonical.document_version
    and document.language = canonical.language
  where document.sha256 is distinct from canonical.sha256;

  if v_mismatch_count <> 0 then
    raise exception 'Canonical legal hash reconciliation failed for % rows', v_mismatch_count;
  end if;
end;
$$;

comment on table private.legal_document_versions is
  'Versioned legal document metadata. Staged hashes may be corrected by reviewed forward migration; effective evidence is immutable.';
