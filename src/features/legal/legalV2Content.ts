import type { Lang } from '@/i18n'
import type { LegalV2DocumentId } from '@/config/legalV2'
import {
  commercialLegalContent,
  getCommercialLegalDocument,
  legalText as text,
  type LegalDocumentSource,
  type LegalSectionSource,
  type LocalizedCommercialLegalDocument,
} from './commercialLegalContent'

function section(
  id: string,
  title: ReturnType<typeof text>,
  paragraphs: ReturnType<typeof text>[],
  items: ReturnType<typeof text>[] = [],
): LegalSectionSource {
  return { id, title, paragraphs, items }
}

const legal: LegalDocumentSource = {
  title: text('Mentions légales', 'Legal notice', 'الإشعار القانوني'),
  introduction: text(
    'Clikarage est un service édité par RODANBTECH.',
    'Clikarage is a service published by RODANBTECH.',
    'Clikarage خدمة تنشرها RODANBTECH.',
  ),
  sections: [
    section('publisher', text('1. Éditeur du service', '1. Service publisher', '1. ناشر الخدمة'), [text(
      'Le service Clikarage est édité par Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel exerçant sous le nom commercial RODANBTECH, immatriculé au RNE le 17 avril 2026. SIREN 103 878 187, SIRET 103 878 187 00014, code APE 62.01Z. Siège : 47 rue Vivienne, 75002 Paris, France. Clikarage est le nom du produit logiciel et non une société distincte.',
      'Clikarage is published by Anas RODRIGUEZ BENKARROUM, a French sole trader operating under the trading name RODANBTECH and registered with the RNE on 17 April 2026. SIREN 103 878 187, SIRET 103 878 187 00014, APE code 62.01Z. Registered address: 47 rue Vivienne, 75002 Paris, France. Clikarage is the software product name, not a separate company.',
      'تنشر خدمة Clikarage مؤسسة Anas RODRIGUEZ BENKARROUM الفردية التي تعمل بالاسم التجاري RODANBTECH والمسجلة في RNE بتاريخ 17 أبريل 2026. رقم SIREN هو 103 878 187 ورقم SIRET هو 103 878 187 00014 ورمز APE هو 62.01Z. العنوان: 47 rue Vivienne, 75002 Paris, France. وClikarage اسم المنتج البرمجي وليس شركة مستقلة.',
    )]),
    section('director-contact', text('2. Publication et contact', '2. Publication and contact', '2. النشر والاتصال'), [text(
      'Le directeur de la publication est Anas RODRIGUEZ BENKARROUM. Le contact juridique, confidentialité et signalement est anas.rodriguez@rodanbtech.com ; téléphone +33 7 81 18 93 65.',
      'The publication director is Anas RODRIGUEZ BENKARROUM. The legal, privacy and reporting contact is anas.rodriguez@rodanbtech.com; telephone +33 7 81 18 93 65.',
      'مدير النشر هو Anas RODRIGUEZ BENKARROUM. جهة الاتصال للشؤون القانونية والخصوصية والإبلاغ هي anas.rodriguez@rodanbtech.com والهاتف +33 7 81 18 93 65.',
    )]),
    section('hosting', text('3. Hébergement et infrastructure', '3. Hosting and infrastructure', '3. الاستضافة والبنية التحتية'), [text(
      'L’interface web est déployée par Vercel Inc. La base de données, l’authentification, les API et le stockage technique sont fournis par Supabase, avec une région principale configurée à Paris (eu-west-3). Le domaine et le DNS sont administrés avec Squarespace et la messagerie professionnelle avec Google Workspace. Le registre des prestataires précise les finalités et réserves applicables.',
      'The web interface is deployed by Vercel Inc. Database, authentication, APIs and technical storage are provided by Supabase, with the primary region configured in Paris (eu-west-3). Domain and DNS are administered with Squarespace and professional email with Google Workspace. The provider register describes applicable purposes and reservations.',
      'تُنشر واجهة الويب بواسطة Vercel Inc. وتوفر Supabase قاعدة البيانات والمصادقة وواجهات API والتخزين التقني، مع إعداد المنطقة الرئيسية في باريس (eu-west-3). ويُدار النطاق وDNS عبر Squarespace والبريد المهني عبر Google Workspace. ويوضح سجل المزودين الأغراض والتحفظات المطبقة.',
    )]),
    section('vat', text('4. Fiscalité', '4. Tax status', '4. الوضع الضريبي'), [text(
      'TVA non applicable, article 293 B du Code général des impôts, tant que les conditions de la franchise en base demeurent réunies.',
      'VAT not applicable under Article 293 B of the French General Tax Code, for as long as the conditions of the French VAT exemption remain satisfied.',
      'لا تطبق ضريبة القيمة المضافة وفق المادة 293 B من القانون العام للضرائب الفرنسي ما دامت شروط الإعفاء الأساسي مستوفاة.',
    )]),
    section('intellectual-property', text('5. Propriété intellectuelle', '5. Intellectual property', '5. الملكية الفكرية'), [text(
      'La structure, les interfaces, les textes éditoriaux, les éléments graphiques et le logiciel Clikarage sont protégés. Aucun droit de propriété n’est transféré hors des droits d’utilisation expressément accordés par un contrat ou la loi. Les contenus et marques d’un garage restent sous sa responsabilité et sa propriété ou celle de leurs titulaires.',
      'The structure, interfaces, editorial text, graphic elements and Clikarage software are protected. No ownership right is transferred beyond use rights expressly granted by contract or law. Garage content and trademarks remain under the garage’s responsibility and ownership or that of their respective owners.',
      'تحظى بنية Clikarage وواجهاته ونصوصه التحريرية وعناصره الرسومية وبرمجياته بالحماية. ولا ينتقل أي حق ملكية خارج حقوق الاستخدام الممنوحة صراحة بالعقد أو القانون. وتبقى محتويات الورشة وعلاماتها تحت مسؤوليتها وملكيتها أو ملكية أصحابها.',
    )]),
    section('role', text('6. Rôle du service', '6. Role of the service', '6. دور الخدمة'), [text(
      'Clikarage est un outil SaaS de gestion de l’expérience client après-vente automobile. RODANBTECH n’est pas réparateur, expert automobile, assureur, intermédiaire de paiement ou conseil du garage. Le garage reste seul responsable de ses diagnostics, devis, prix, travaux, délais, garanties et obligations professionnelles.',
      'Clikarage is SaaS software for managing the automotive after-sales customer experience. RODANBTECH is not the garage’s repairer, vehicle expert, insurer, payment intermediary or adviser. The garage remains solely responsible for diagnoses, quotes, prices, work, timescales, warranties and professional duties.',
      'Clikarage أداة SaaS لإدارة تجربة عملاء خدمات ما بعد البيع للسيارات. ولا تعمل RODANBTECH كمصلح أو خبير سيارات أو شركة تأمين أو وسيط دفع أو مستشار للورشة. وتبقى الورشة وحدها مسؤولة عن التشخيص والعروض والأسعار والأعمال والمواعيد والضمانات والالتزامات المهنية.',
    )]),
    section('liability-reporting', text('7. Responsabilité éditoriale et signalement', '7. Editorial responsibility and reporting', '7. المسؤولية التحريرية والإبلاغ'), [text(
      'RODANBTECH met en œuvre des moyens raisonnables pour exploiter et sécuriser le service, sans promettre une disponibilité ou une sécurité absolue. Un contenu manifestement illicite, une atteinte aux droits ou une vulnérabilité peuvent être signalés au contact officiel avec les éléments permettant leur examen.',
      'RODANBTECH uses reasonable measures to operate and secure the service without promising absolute availability or security. Clearly unlawful content, rights infringements or vulnerabilities may be reported to the official contact with enough information for review.',
      'تتخذ RODANBTECH تدابير معقولة لتشغيل الخدمة وتأمينها دون التعهد بتوفر أو أمن مطلق. ويمكن الإبلاغ إلى جهة الاتصال الرسمية عن المحتوى غير المشروع بوضوح أو انتهاك الحقوق أو الثغرات مع المعلومات اللازمة لفحصها.',
    )]),
  ],
}

const termsClient: LegalDocumentSource = {
  title: text('Conditions d’accès à l’Espace Client', 'Client Space access terms', 'شروط الوصول إلى مساحة العميل'),
  introduction: text(
    'Ces conditions encadrent uniquement l’accès de l’automobiliste à son dossier. Le garage reste le professionnel automobile responsable de la prestation.',
    'These terms govern only a motorist’s access to their record. The garage remains the automotive professional responsible for the service.',
    'تنظم هذه الشروط وصول صاحب المركبة إلى ملفه فقط. وتظل الورشة هي المهني المسؤول عن الخدمة المتعلقة بالسيارة.',
  ),
  sections: [
    section('purpose', text('1. Objet', '1. Purpose', '1. الغرض'), [text(
      'L’Espace Client permet de demander un rendez-vous, consulter un dossier, échanger avec le garage, consulter un devis ou une recommandation, exprimer une décision et accéder aux documents que le garage rend visibles. Il ne crée pas un contrat de réparation avec RODANBTECH.',
      'The Client Space lets a motorist request an appointment, view a record, communicate with the garage, view a quote or recommendation, express a decision and access documents made visible by the garage. It does not create a repair contract with RODANBTECH.',
      'تتيح مساحة العميل طلب موعد والاطلاع على ملف والتواصل مع الورشة ومراجعة عرض أو توصية وإبداء قرار والوصول إلى المستندات التي تتيحها الورشة. ولا تنشئ عقد إصلاح مع RODANBTECH.',
    )]),
    section('account', text('2. Compte et informations', '2. Account and information', '2. الحساب والمعلومات'), [text(
      'L’utilisateur fournit des informations exactes, protège ses identifiants et signale tout accès suspect. Il ne doit pas partager un lien privé, un token de devis ou un document avec une personne non autorisée.',
      'The user provides accurate information, protects credentials and reports suspicious access. Private links, quote tokens and documents must not be shared with unauthorised persons.',
      'يقدم المستخدم معلومات صحيحة ويحمي بيانات دخوله ويبلغ عن أي وصول مشبوه. ولا يجوز مشاركة رابط خاص أو رمز عرض أو مستند مع شخص غير مخول.',
    )]),
    section('appointments', text('3. Demandes et rendez-vous', '3. Requests and appointments', '3. الطلبات والمواعيد'), [text(
      'Une demande transmise via Clikarage n’est confirmée que lorsque le garage la confirme. Le garage détermine ses disponibilités, conditions de dépôt, délais et modalités d’intervention.',
      'A request sent through Clikarage is confirmed only when the garage confirms it. The garage determines availability, drop-off conditions, timescales and service arrangements.',
      'لا يتأكد الطلب المرسل عبر Clikarage إلا بعد تأكيد الورشة. وتحدد الورشة التوفر وشروط إيداع المركبة والمواعيد وترتيبات التدخل.',
    )]),
    section('quotes', text('4. Devis, recommandations et décisions', '4. Quotes, recommendations and decisions', '4. العروض والتوصيات والقرارات'), [text(
      'Les devis, diagnostics et recommandations proviennent du garage. Une acceptation, un refus, une question ou une demande de rappel est horodaté et transmis au garage. L’utilisateur vérifie le contenu et le montant avant de décider ; RODANBTECH ne décide ni des travaux ni de leur opportunité.',
      'Quotes, diagnoses and recommendations come from the garage. Acceptance, refusal, a question or a callback request is timestamped and sent to the garage. The user checks content and amount before deciding; RODANBTECH decides neither the work nor whether it is appropriate.',
      'تصدر العروض والتشخيصات والتوصيات عن الورشة. ويُسجل وقت القبول أو الرفض أو السؤال أو طلب الاتصال ويُرسل إلى الورشة. ويتحقق المستخدم من المحتوى والمبلغ قبل القرار؛ ولا تقرر RODANBTECH الأعمال أو مدى ملاءمتها.',
    )]),
    section('documents-history', text('5. Documents et historique', '5. Documents and history', '5. المستندات والسجل'), [text(
      'L’utilisateur accède uniquement aux éléments que le garage rend visibles pour son dossier. Les documents internes restent inaccessibles. Un historique peut être incomplet si le garage n’a pas saisi ou importé toutes les opérations.',
      'The user accesses only items the garage makes visible for their record. Internal documents remain inaccessible. History may be incomplete where the garage has not entered or imported every operation.',
      'لا يصل المستخدم إلا إلى العناصر التي تتيحها الورشة لملفه. وتبقى المستندات الداخلية غير متاحة. وقد يكون السجل غير مكتمل إذا لم تدخل الورشة جميع العمليات أو تستوردها.',
    )]),
    section('content', text('6. Messages et contenus', '6. Messages and content', '6. الرسائل والمحتوى'), [text(
      'Les messages doivent rester utiles au dossier et ne pas contenir de données excessives, illicites, dangereuses ou concernant un tiers sans droit. Les urgences mécaniques ou de sécurité doivent être adressées directement au garage ou aux services compétents.',
      'Messages must remain relevant to the record and must not contain excessive, unlawful or dangerous data, or third-party data without authority. Mechanical or safety emergencies must be addressed directly to the garage or competent services.',
      'يجب أن تظل الرسائل مرتبطة بالملف وألا تتضمن بيانات مفرطة أو غير مشروعة أو خطرة أو تخص طرفًا ثالثًا دون حق. ويجب توجيه الحالات الميكانيكية أو الأمنية العاجلة مباشرة إلى الورشة أو الجهات المختصة.',
    )]),
    section('availability', text('7. Disponibilité et sécurité', '7. Availability and security', '7. التوفر والأمن'), [text(
      'L’accès peut être interrompu pour maintenance, incident, sécurité ou indisponibilité d’un fournisseur. Aucun niveau de service garanti ne s’applique à l’automobiliste. Le garage reste joignable par ses canaux habituels.',
      'Access may be interrupted for maintenance, incidents, security or provider unavailability. No guaranteed service level applies to the motorist. The garage remains reachable through its usual channels.',
      'قد ينقطع الوصول بسبب الصيانة أو الحوادث أو الأمن أو عدم توفر مزود. ولا ينطبق مستوى خدمة مضمون على صاحب المركبة. وتظل الورشة متاحة عبر قنواتها المعتادة.',
    )]),
    section('privacy', text('8. Données personnelles', '8. Personal data', '8. البيانات الشخصية'), [text(
      'Le garage est en principe responsable du traitement de son dossier client. RODANBTECH traite ces données pour fournir Clikarage selon les instructions du garage et traite séparément les données nécessaires à la sécurité du compte et à la preuve. La Politique de confidentialité détaille les rôles et droits.',
      'The garage is generally controller for its customer record. RODANBTECH processes that data to provide Clikarage under garage instructions and separately processes data needed for account security and evidence. The Privacy policy explains roles and rights.',
      'تكون الورشة في الأصل مسؤولة عن معالجة ملف عميلها. وتعالج RODANBTECH هذه البيانات لتوفير Clikarage وفق تعليمات الورشة، وتعالج بصورة مستقلة البيانات اللازمة لأمن الحساب والإثبات. وتوضح سياسة الخصوصية الأدوار والحقوق.',
    )]),
    section('suspension', text('9. Suspension et suppression', '9. Suspension and deletion', '9. التعليق والحذف'), [text(
      'Un accès peut être suspendu en cas de risque de sécurité, fraude, usage illicite ou demande légitime du garage. Les demandes de rectification ou suppression relatives au dossier métier sont adressées d’abord au garage ; RODANBTECH traite celles relevant de son propre rôle.',
      'Access may be suspended for security risk, fraud, unlawful use or a legitimate garage request. Requests to correct or delete business-record data should first be sent to the garage; RODANBTECH handles requests within its own role.',
      'يمكن تعليق الوصول بسبب خطر أمني أو احتيال أو استخدام غير مشروع أو طلب مشروع من الورشة. وتوجه طلبات تصحيح بيانات الملف المهني أو حذفها أولًا إلى الورشة؛ وتعالج RODANBTECH الطلبات الداخلة في دورها.',
    )]),
    section('law-contact', text('10. Droit applicable et réclamations', '10. Governing law and complaints', '10. القانون المطبق والشكاوى'), [text(
      'Le droit français s’applique sous réserve des règles impératives protégeant l’utilisateur. Une réclamation relative au véhicule ou à la prestation est adressée au garage ; une réclamation relative à Clikarage ou aux données traitées par RODANBTECH est adressée à anas.rodriguez@rodanbtech.com.',
      'French law applies subject to mandatory rules protecting the user. A complaint about the vehicle or garage service is sent to the garage; a complaint about Clikarage or data processed by RODANBTECH is sent to anas.rodriguez@rodanbtech.com.',
      'يطبق القانون الفرنسي مع مراعاة القواعد الآمرة التي تحمي المستخدم. وتوجه الشكوى المتعلقة بالمركبة أو خدمة الورشة إلى الورشة، أما الشكوى المتعلقة بـClikarage أو البيانات التي تعالجها RODANBTECH فتوجه إلى anas.rodriguez@rodanbtech.com.',
    )]),
  ],
}

const privacy: LegalDocumentSource = {
  title: text('Politique de confidentialité', 'Privacy policy', 'سياسة الخصوصية'),
  introduction: text(
    'Cette politique explique les traitements réellement liés à Clikarage et distingue les rôles du garage et de RODANBTECH.',
    'This policy explains processing actually connected with Clikarage and distinguishes the roles of the garage and RODANBTECH.',
    'توضح هذه السياسة عمليات المعالجة المرتبطة فعليًا بـClikarage وتميز بين دور الورشة ودور RODANBTECH.',
  ),
  sections: [
    section('roles', text('1. Qui traite les données ?', '1. Who processes data?', '1. من يعالج البيانات؟'), [text(
      'Le garage est responsable de traitement pour les données de ses clients, véhicules et dossiers. RODANBTECH agit comme sous-traitant lorsqu’il fournit Clikarage selon les instructions du garage. RODANBTECH est responsable de traitement pour la gestion de ses propres comptes, contrats, sécurité, support, facturation, prospection professionnelle et preuves juridiques.',
      'The garage is controller for its customers, vehicles and service records. RODANBTECH acts as processor when providing Clikarage under garage instructions. RODANBTECH is controller for its own account, contract, security, support, billing, business-prospecting and legal-evidence processing.',
      'تكون الورشة مسؤولة عن معالجة بيانات عملائها ومركباتهم وملفاتهم. وتعمل RODANBTECH كمعالج عند توفير Clikarage وفق تعليمات الورشة. وتكون RODANBTECH مسؤولة عن معالجة حساباتها وعقودها وأمنها ودعمها وفوترتها وتسويقها المهني وأدلتها القانونية.',
    )]),
    section('contact', text('2. Contact confidentialité', '2. Privacy contact', '2. جهة اتصال الخصوصية'), [text(
      'RODANBTECH — Anas RODRIGUEZ BENKARROUM, 47 rue Vivienne, 75002 Paris, France. Email : anas.rodriguez@rodanbtech.com. Aucun délégué à la protection des données n’est désigné à ce stade.',
      'RODANBTECH — Anas RODRIGUEZ BENKARROUM, 47 rue Vivienne, 75002 Paris, France. Email: anas.rodriguez@rodanbtech.com. No data protection officer is currently appointed.',
      'RODANBTECH — Anas RODRIGUEZ BENKARROUM، 47 rue Vivienne, 75002 Paris, France. البريد: anas.rodriguez@rodanbtech.com. لم يُعين مسؤول لحماية البيانات في الوقت الحالي.',
    )]),
    section('people-data', text('3. Personnes et données', '3. People and data', '3. الأشخاص والبيانات'), [text(
      'Les personnes concernées comprennent les représentants et utilisateurs des garages, automobilistes, prospects, destinataires de notifications et contacts de support. Les données peuvent inclure identité, coordonnées, compte, rôle, garage et centre, véhicule, kilométrage, rendez-vous, dossier, messages, devis, décisions, recommandations, pièces jointes, rapports, rappels, notifications, acceptations légales et journaux techniques.',
      'Data subjects include garage representatives and users, motorists, prospects, notification recipients and support contacts. Data may include identity, contact details, account, role, garage and centre, vehicle, mileage, appointment, record, messages, quotes, decisions, recommendations, attachments, reports, reminders, notifications, legal acceptances and technical logs.',
      'يشمل أصحاب البيانات ممثلي الورش ومستخدميها وأصحاب المركبات والعملاء المحتملين ومستلمي الإشعارات وجهات اتصال الدعم. وقد تشمل البيانات الهوية والاتصال والحساب والدور والورشة والمركز والمركبة والمسافة والموعد والملف والرسائل والعروض والقرارات والتوصيات والمرفقات والتقارير والتذكيرات والإشعارات والموافقات القانونية والسجلات التقنية.',
    )]),
    section('purposes-bases', text('4. Finalités et bases légales', '4. Purposes and legal bases', '4. الأغراض والأسس القانونية'), [text(
      'RODANBTECH traite les données nécessaires à l’exécution du contrat et aux mesures précontractuelles, au respect de ses obligations légales, et à ses intérêts légitimes de sécurité, support, prévention de la fraude, preuve et prospection B2B proportionnée. Un consentement est demandé lorsque la loi l’exige pour une communication ou un traceur facultatif. Pour les dossiers automobiles, le garage détermine et documente la base légale applicable.',
      'RODANBTECH processes data needed to perform the contract and take pre-contract steps, comply with legal duties, and pursue legitimate interests in security, support, fraud prevention, evidence and proportionate B2B prospecting. Consent is requested where law requires it for optional communications or trackers. For automotive records, the garage determines and documents the applicable legal basis.',
      'تعالج RODANBTECH البيانات اللازمة لتنفيذ العقد والإجراءات السابقة له والوفاء بالتزاماتها القانونية وتحقيق مصالحها المشروعة في الأمن والدعم ومنع الاحتيال والإثبات والتسويق المهني المتناسب. وتطلب الموافقة عندما يوجبها القانون للاتصالات أو أدوات التتبع الاختيارية. أما ملفات السيارات فتحدد الورشة أساسها القانوني وتوثقه.',
    )]),
    section('sources', text('5. Sources', '5. Sources', '5. المصادر'), [text(
      'Les données proviennent de la personne, du garage, de ses utilisateurs, de l’utilisation du service et des systèmes tiers qu’un client choisit de connecter. Les données librement rédigées par un garage ou un automobiliste ne sont pas traduites ni enrichies automatiquement.',
      'Data comes from the individual, the garage, its users, use of the service and third-party systems a customer chooses to connect. Free-form data written by a garage or motorist is not automatically translated or enriched.',
      'تأتي البيانات من الشخص أو الورشة أو مستخدميها أو استخدام الخدمة أو الأنظمة الخارجية التي يختار العميل ربطها. ولا تُترجم البيانات الحرة التي تكتبها الورشة أو صاحب المركبة ولا تُثرى تلقائيًا.',
    )]),
    section('recipients', text('6. Destinataires et prestataires', '6. Recipients and providers', '6. المستلمون والمزودون'), [text(
      'Les données sont accessibles aux utilisateurs habilités du garage, à l’automobiliste pour son propre dossier, à RODANBTECH dans la limite de ses missions et aux prestataires nécessaires. Les services actifs comprennent Supabase pour la base, l’authentification, les API et le stockage technique, Vercel pour le frontend et le CDN, Squarespace pour le domaine et Google Workspace pour la messagerie professionnelle. Stripe, les fournisseurs d’IA, SMS, DMS et email transactionnel ne sont pas actifs dans Clikarage à cette version.',
      'Data is accessible to authorised garage users, the motorist for their own record, RODANBTECH within its duties and necessary providers. Active services include Supabase for database, authentication, APIs and technical storage, Vercel for frontend and CDN, Squarespace for the domain and Google Workspace for professional email. Stripe, AI, SMS, DMS and transactional-email providers are not active in this Clikarage version.',
      'تتاح البيانات لمستخدمي الورشة المخولين ولصاحب المركبة في ملفه ولـRODANBTECH ضمن مهامها وللمزودين الضروريين. تشمل الخدمات النشطة Supabase لقاعدة البيانات والمصادقة وواجهات API والتخزين التقني، وVercel للواجهة وCDN، وSquarespace للنطاق، وGoogle Workspace للبريد المهني. ولا تنشط Stripe أو مزودات الذكاء الاصطناعي أو الرسائل النصية أو DMS أو البريد المعاملاتي في هذا الإصدار.',
    )]),
    section('transfers', text('7. Localisation et transferts', '7. Location and transfers', '7. الموقع وعمليات النقل'), [text(
      'La région principale de la base Supabase est Paris (eu-west-3). Certains prestataires ou sous-traitants peuvent traiter des données hors de l’Espace économique européen. Les garanties applicables reposent sur le contrat fournisseur, les décisions d’adéquation ou les clauses contractuelles types et mesures complémentaires pertinentes. Le registre des prestataires est tenu à jour avant toute mise en vigueur.',
      'The primary Supabase database region is Paris (eu-west-3). Some providers or sub-processors may process data outside the European Economic Area. Applicable safeguards rely on provider agreements, adequacy decisions or relevant standard contractual clauses and supplementary measures. The provider register is kept current before effectiveness.',
      'تقع المنطقة الرئيسية لقاعدة Supabase في باريس (eu-west-3). وقد يعالج بعض المزودين أو المعالجين اللاحقين البيانات خارج المنطقة الاقتصادية الأوروبية. وتعتمد الضمانات على عقود المزودين أو قرارات الكفاية أو البنود التعاقدية القياسية والتدابير التكميلية المناسبة. ويُحدث سجل المزودين قبل النفاذ.',
    )]),
    section('retention', text('8. Conservation', '8. Retention', '8. الاحتفاظ'), [text(
      'Les comptes et contrats sont conservés pendant la relation puis pendant les délais nécessaires à la preuve et aux obligations comptables. Les dossiers, documents, messages et rappels suivent les instructions et obligations du garage. Les acceptations légales sont conservées pendant la durée nécessaire à la preuve, sans réécriture. Les journaux techniques et adresses de notification sont limités à la durée utile à la sécurité, l’envoi, le diagnostic et la preuve. Les sauvegardes expirent selon leur cycle technique documenté. Une obligation légale ou un litige peut justifier une conservation plus longue et limitée.',
      'Accounts and contracts are retained during the relationship and for periods needed for evidence and accounting duties. Records, documents, messages and reminders follow garage instructions and duties. Legal acceptances are retained as long as needed for evidence without being rewritten. Technical logs and notification addresses are limited to the period needed for security, delivery, diagnosis and evidence. Backups expire under their documented technical cycle. A legal duty or dispute may justify longer limited retention.',
      'تُحفظ الحسابات والعقود أثناء العلاقة وللمدد اللازمة للإثبات والالتزامات المحاسبية. وتتبع الملفات والمستندات والرسائل والتذكيرات تعليمات الورشة والتزاماتها. وتُحفظ الموافقات القانونية للمدة اللازمة للإثبات دون إعادة كتابتها. وتقتصر السجلات التقنية وعناوين الإشعار على المدة اللازمة للأمن والإرسال والتشخيص والإثبات. وتنتهي النسخ الاحتياطية وفق دورتها التقنية الموثقة. وقد يبرر التزام قانوني أو نزاع حفظًا أطول ومحدودًا.',
    )]),
    section('rights', text('9. Droits des personnes', '9. Individual rights', '9. حقوق الأشخاص'), [text(
      'Selon le contexte, une personne peut demander accès, rectification, effacement, limitation, opposition ou portabilité et retirer un consentement sans effet rétroactif. Pour un dossier automobile, elle contacte d’abord le garage responsable. Pour les traitements propres à RODANBTECH, elle écrit à anas.rodriguez@rodanbtech.com. Une réclamation peut être adressée à la CNIL.',
      'Depending on context, an individual may request access, correction, erasure, restriction, objection or portability and withdraw consent without retroactive effect. For an automotive record, they first contact the controller garage. For RODANBTECH’s own processing, they write to anas.rodriguez@rodanbtech.com. A complaint may be submitted to the CNIL.',
      'بحسب السياق يمكن للشخص طلب الوصول أو التصحيح أو المحو أو التقييد أو الاعتراض أو النقل وسحب الموافقة دون أثر رجعي. وبالنسبة لملف السيارة يتصل أولًا بالورشة المسؤولة. وبالنسبة لمعالجة RODANBTECH يكتب إلى anas.rodriguez@rodanbtech.com. ويمكن تقديم شكوى إلى CNIL.',
    )]),
    section('security', text('10. Sécurité et incidents', '10. Security and incidents', '10. الأمن والحوادث'), [text(
      'Les mesures incluent authentification, rôles, isolation des organisations et centres, RLS, contrôles serveur, chiffrement des communications, stockage privé, URLs signées temporaires, sauvegardes, journalisation et tests anti-fuite. Aucun système n’offre une sécurité absolue. Les violations sont analysées et notifiées selon les rôles et délais légaux applicables.',
      'Measures include authentication, roles, organisation and centre isolation, RLS, server controls, encrypted communications, private storage, temporary signed URLs, backups, logging and anti-leakage tests. No system provides absolute security. Breaches are assessed and notified under applicable roles and legal time limits.',
      'تشمل التدابير المصادقة والأدوار وعزل المؤسسات والمراكز وRLS وضوابط الخادم وتشفير الاتصالات والتخزين الخاص والروابط الموقعة المؤقتة والنسخ الاحتياطية والسجلات واختبارات منع التسرب. ولا يوفر أي نظام أمنًا مطلقًا. وتُقيّم الخروقات ويُبلغ عنها وفق الأدوار والمهل القانونية.',
    )]),
    section('automated', text('11. Décisions automatisées et IA', '11. Automated decisions and AI', '11. القرارات الآلية والذكاء الاصطناعي'), [text(
      'Clikarage ne prend pas de décision produisant des effets juridiques à la place du garage ou de l’automobiliste. Aucune fonctionnalité d’IA externe n’est active dans cette version.',
      'Clikarage does not make decisions producing legal effects instead of the garage or motorist. No external AI feature is active in this version.',
      'لا يتخذ Clikarage قرارات تنتج آثارًا قانونية بدلًا من الورشة أو صاحب المركبة. ولا توجد خاصية ذكاء اصطناعي خارجية نشطة في هذا الإصدار.',
    )]),
    section('trackers-updates', text('12. Traceurs et mises à jour', '12. Trackers and updates', '12. أدوات التتبع والتحديثات'), [text(
      'Les mécanismes de stockage terminal et traceurs sont décrits dans la page dédiée. Une modification substantielle de cette politique est versionnée et signalée par un moyen adapté. La version française constitue la référence en cas de divergence de traduction.',
      'Terminal-storage mechanisms and trackers are described on the dedicated page. A material policy change is versioned and notified by an appropriate means. The French version is the reference if translations differ.',
      'توضح الصفحة المخصصة آليات التخزين على الجهاز وأدوات التتبع. ويُرقم أي تعديل جوهري في هذه السياسة ويُبلغ عنه بطريقة مناسبة. وتكون النسخة الفرنسية المرجع عند اختلاف الترجمات.',
    )]),
  ],
}

const cookies: LegalDocumentSource = {
  title: text('Cookies, stockage terminal et traceurs', 'Cookies, terminal storage and trackers', 'ملفات الارتباط والتخزين على الجهاز وأدوات التتبع'),
  introduction: text(
    'Cette page décrit les mécanismes observés dans Clikarage. Elle est mise à jour avant l’activation de tout outil facultatif.',
    'This page describes mechanisms observed in Clikarage. It is updated before any optional tool is enabled.',
    'تصف هذه الصفحة الآليات الملحوظة في Clikarage وتُحدث قبل تفعيل أي أداة اختيارية.',
  ),
  sections: [
    section('technologies', text('1. Technologies utilisées', '1. Technologies used', '1. التقنيات المستخدمة'), [text(
      'Clikarage utilise le stockage local du navigateur, le stockage de session, la persistance Supabase Auth et un service worker PWA avec caches techniques. Ces mécanismes assurent la session, la langue, le thème, le branding, la navigation, les brouillons et le fonctionnement de démonstration.',
      'Clikarage uses browser local storage, session storage, Supabase Auth persistence and a PWA service worker with technical caches. They support session, language, theme, branding, navigation, drafts and demo operation.',
      'يستخدم Clikarage التخزين المحلي للمتصفح وتخزين الجلسة واستمرارية Supabase Auth وعامل خدمة PWA بذاكرات تخزين تقنية. وتدعم هذه الآليات الجلسة واللغة والمظهر والعلامة والتنقل والمسودات وعمل العرض.',
    )]),
    section('necessary', text('2. Mécanismes strictement nécessaires', '2. Strictly necessary mechanisms', '2. الآليات الضرورية تمامًا'), [text(
      'La session Auth, les protections de sécurité, les préférences de langue et thème, les choix de navigation et les caches PWA nécessaires sont utilisés pour fournir le service demandé. Leur désactivation dans le navigateur peut empêcher la connexion ou dégrader le fonctionnement.',
      'Auth session, security safeguards, language and theme preferences, navigation choices and necessary PWA caches are used to provide the requested service. Disabling them in the browser may prevent sign-in or degrade operation.',
      'تُستخدم جلسة المصادقة وضمانات الأمن وتفضيلات اللغة والمظهر وخيارات التنقل وذاكرات PWA اللازمة لتوفير الخدمة المطلوبة. وقد يؤدي تعطيلها في المتصفح إلى منع الدخول أو تدهور التشغيل.',
    )]),
    section('inventory', text('3. Inventaire opérationnel', '3. Operational inventory', '3. الجرد التشغيلي'), [text(
      'Les clés techniques historiques `gf-*` et `garageflow-auth` sont conservées pour compatibilité. Le stockage de démonstration ne contient que les données simulées créées dans le navigateur. Les rôles de démonstration et brouillons temporaires sont isolés par onglet dans le stockage de session.',
      'Historical technical keys `gf-*` and `garageflow-auth` are retained for compatibility. Demo storage contains only simulated data created in the browser. Demo roles and temporary drafts are isolated per tab in session storage.',
      'تُحفظ المفاتيح التقنية التاريخية `gf-*` و`garageflow-auth` للتوافق. ولا يحتوي تخزين العرض إلا على بيانات محاكاة تُنشأ في المتصفح. وتُعزل أدوار العرض والمسودات المؤقتة لكل تبويب في تخزين الجلسة.',
    )]),
    section('analytics', text('4. Mesure d’audience', '4. Audience measurement', '4. قياس الجمهور'), [text(
      'Aucun outil de mesure d’audience Vercel Analytics ou traceur marketing n’est actif dans cette version. Le flag correspondant est désactivé par défaut. Toute activation future exige une mise à jour de cette page et, lorsque la loi l’impose, un choix préalable de l’utilisateur.',
      'No Vercel Analytics audience tool or marketing tracker is active in this version. The corresponding flag is off by default. Future activation requires this page to be updated and, where required by law, prior user choice.',
      'لا تنشط في هذا الإصدار أداة Vercel Analytics لقياس الجمهور ولا أداة تتبع تسويقية. ويكون العلم المقابل معطلًا افتراضيًا. ويتطلب أي تفعيل لاحق تحديث هذه الصفحة، وعند وجوب القانون اختيار المستخدم مسبقًا.',
    )]),
    section('third-party-resources', text('5. Ressources tierces', '5. Third-party resources', '5. الموارد الخارجية'), [text(
      'Les polices utilisées par l’application sont servies localement ou remplacées par des polices disponibles sur l’appareil. Aucun appel Google Fonts n’est requis par le corpus V2. Les appels nécessaires à Supabase et Vercel relèvent de la fourniture du service.',
      'Application fonts are served locally or replaced by fonts available on the device. No Google Fonts request is required by the V2 corpus. Calls needed for Supabase and Vercel form part of service delivery.',
      'تُقدم خطوط التطبيق محليًا أو تُستبدل بخطوط متاحة على الجهاز. ولا يحتاج الإصدار V2 إلى طلب Google Fonts. وتدخل الطلبات اللازمة إلى Supabase وVercel ضمن تقديم الخدمة.',
    )]),
    section('choices', text('6. Choix et effacement', '6. Choice and deletion', '6. الاختيار والحذف'), [text(
      'L’utilisateur peut effacer les données du site depuis son navigateur et se déconnecter pour révoquer la session locale. Les mécanismes strictement nécessaires ne font pas l’objet d’un consentement, mais sont décrits ici. Un outil facultatif ne doit pas être déposé avant le choix requis.',
      'Users can clear site data in their browser and sign out to revoke the local session. Strictly necessary mechanisms do not rely on consent but are described here. An optional tool must not be set before any required choice.',
      'يمكن للمستخدم مسح بيانات الموقع من متصفحه وتسجيل الخروج لإلغاء الجلسة المحلية. ولا تعتمد الآليات الضرورية تمامًا على الموافقة لكنها موضحة هنا. ولا يجوز وضع أداة اختيارية قبل الاختيار المطلوب.',
    )]),
    section('updates', text('7. Mise à jour', '7. Updates', '7. التحديث'), [text(
      'Cet inventaire est revu lors de l’ajout d’un fournisseur, d’un SDK, d’un domaine tiers ou d’une nouvelle finalité. Le contact est anas.rodriguez@rodanbtech.com.',
      'This inventory is reviewed when a provider, SDK, third-party domain or new purpose is added. Contact: anas.rodriguez@rodanbtech.com.',
      'يُراجع هذا الجرد عند إضافة مزود أو SDK أو نطاق خارجي أو غرض جديد. جهة الاتصال: anas.rodriguez@rodanbtech.com.',
    )]),
  ],
}

const subprocessors: LegalDocumentSource = {
  title: text('Registre des prestataires et sous-traitants', 'Provider and sub-processor register', 'سجل المزودين والمعالجين اللاحقين'),
  introduction: text(
    'Le registre distingue les services actifs des capacités futures. Les entités contractantes restent vérifiées contre les contrats du compte avant mise en vigueur.',
    'The register distinguishes active services from future capabilities. Contracting entities remain checked against account agreements before effectiveness.',
    'يميز السجل بين الخدمات النشطة والقدرات المستقبلية. وتُراجع الكيانات المتعاقدة وفق عقود الحساب قبل النفاذ.',
  ),
  sections: [
    section('supabase', text('1. Supabase', '1. Supabase', '1. Supabase'), [text(
      'Service actif : base PostgreSQL, authentification, API, journaux techniques et stockage. Région principale du projet : Paris (eu-west-3). Le DPA publié le 1er juin 2026 désigne Supabase Pte. Ltd ; le document contractuel du compte RODANBTECH doit être conservé comme preuve.',
      'Active service: PostgreSQL database, authentication, APIs, technical logs and storage. Primary project region: Paris (eu-west-3). The DPA published on 1 June 2026 names Supabase Pte. Ltd; the RODANBTECH account agreement must be retained as evidence.',
      'الخدمة النشطة: قاعدة PostgreSQL والمصادقة وواجهات API والسجلات التقنية والتخزين. منطقة المشروع الرئيسية: باريس (eu-west-3). ويسمي DPA المنشور في 1 يونيو 2026 شركة Supabase Pte. Ltd؛ ويجب حفظ عقد حساب RODANBTECH كدليل.',
    )]),
    section('vercel', text('2. Vercel', '2. Vercel', '2. Vercel'), [text(
      'Service actif : hébergement du frontend, déploiement et CDN. Les conditions et le DPA applicables désignent Vercel Inc. Vercel Analytics n’est pas actif.',
      'Active service: frontend hosting, deployment and CDN. Applicable terms and DPA name Vercel Inc. Vercel Analytics is not active.',
      'الخدمة النشطة: استضافة الواجهة والنشر وCDN. وتسمّي الشروط وDPA المطبقة شركة Vercel Inc. ولا ينشط Vercel Analytics.',
    )]),
    section('domain-email', text('3. Domaine et messagerie', '3. Domain and email', '3. النطاق والبريد'), [text(
      'Squarespace est utilisé pour le domaine, le DNS et le site vitrine ; pour un client hors États-Unis, ses conditions générales désignent en principe Squarespace Ireland Limited. Google Workspace est utilisé pour la messagerie professionnelle. Les entités exactes et DPA du compte doivent être confirmés avant mise en vigueur.',
      'Squarespace is used for domain, DNS and the showcase site; for a non-US customer its general terms generally designate Squarespace Ireland Limited. Google Workspace is used for professional email. Exact account entities and DPAs must be confirmed before effectiveness.',
      'يُستخدم Squarespace للنطاق وDNS والموقع التعريفي؛ وتحدد شروطه العامة عادة Squarespace Ireland Limited للعميل خارج الولايات المتحدة. ويُستخدم Google Workspace للبريد المهني. ويجب تأكيد كيانات الحساب وDPA الدقيقة قبل النفاذ.',
    )]),
    section('inactive', text('4. Services inactifs', '4. Inactive services', '4. الخدمات غير النشطة'), [text(
      'Stripe, les fournisseurs d’intelligence artificielle, SMS, DMS, CRM, calendrier, email transactionnel et push ne reçoivent aucune donnée par Clikarage tant que leur intégration et leur flag ne sont pas activés. Les notifications de démonstration restent simulées.',
      'Stripe, AI, SMS, DMS, CRM, calendar, transactional-email and push providers receive no data through Clikarage until their integration and flag are enabled. Demo notifications remain simulated.',
      'لا تتلقى Stripe أو مزودات الذكاء الاصطناعي أو SMS أو DMS أو CRM أو التقويم أو البريد المعاملاتي أو الدفع أي بيانات عبر Clikarage ما لم يُفعل التكامل والعلم. وتبقى إشعارات العرض محاكاة.',
    )]),
    section('changes', text('5. Changements', '5. Changes', '5. التغييرات'), [text(
      'Tout nouveau sous-traitant recevant des données métier doit être évalué, ajouté au registre et notifié selon le mécanisme contractuel convenu avant activation. Une objection est traitée conformément au DPA et au contrat applicables.',
      'Any new sub-processor receiving business data must be assessed, added to the register and notified under the agreed contractual mechanism before activation. Objections are handled under the applicable DPA and contract.',
      'يجب تقييم أي معالج لاحق جديد يتلقى بيانات مهنية وإضافته إلى السجل والإبلاغ عنه وفق الآلية التعاقدية المتفق عليها قبل التفعيل. وتُعالج الاعتراضات وفق DPA والعقد المطبقين.',
    )]),
  ],
}

const security: LegalDocumentSource = {
  title: text('Sécurité du service', 'Service security', 'أمن الخدمة'),
  introduction: text(
    'Cette présentation décrit des mesures réellement préparées ou exploitées sans garantir une sécurité absolue.',
    'This overview describes measures actually prepared or operated without guaranteeing absolute security.',
    'يصف هذا العرض التدابير المعدة أو المشغلة فعليًا دون ضمان أمن مطلق.',
  ),
  sections: [
    section('access', text('1. Identité et accès', '1. Identity and access', '1. الهوية والوصول'), [text(
      'Clikarage utilise Supabase Auth, des sessions limitées, des rôles applicatifs et le principe du moindre privilège. Les utilisateurs protègent leurs identifiants et les administrateurs révoquent les comptes devenus inutiles.',
      'Clikarage uses Supabase Auth, limited sessions, application roles and least privilege. Users protect credentials and administrators revoke accounts that are no longer needed.',
      'يستخدم Clikarage مصادقة Supabase وجلسات محدودة وأدوار التطبيق ومبدأ أقل امتياز. ويحمي المستخدمون بيانات الدخول ويلغي المسؤولون الحسابات غير اللازمة.',
    )]),
    section('isolation', text('2. Isolation des données', '2. Data isolation', '2. عزل البيانات'), [text(
      'Les tables exposées sont protégées par RLS et par des contrôles de tenant, garage, centre, dossier et utilisateur. Les opérations sensibles passent par des politiques ou RPC validant l’identité et les paramètres. Les tests anti-fuite couvrent les principaux scénarios cross-tenant.',
      'Exposed tables are protected by RLS and tenant, garage, centre, record and user controls. Sensitive operations use policies or RPCs that validate identity and parameters. Anti-leakage tests cover key cross-tenant scenarios.',
      'تُحمى الجداول المكشوفة بواسطة RLS وضوابط المستأجر والورشة والمركز والملف والمستخدم. وتستخدم العمليات الحساسة سياسات أو RPC تتحقق من الهوية والمعلمات. وتغطي اختبارات منع التسرب أهم سيناريوهات العبور بين المستأجرين.',
    )]),
    section('storage', text('3. Pièces jointes', '3. Attachments', '3. المرفقات'), [text(
      'Le bucket métier est privé. Les chemins, types MIME, tailles et droits sont contrôlés ; les accès client utilisent des autorisations ciblées ou des URLs signées courtes. Le bucket public de branding est réservé aux logos et durci séparément.',
      'The business bucket is private. Paths, MIME types, sizes and permissions are controlled; customer access uses targeted permissions or short-lived signed URLs. The public branding bucket is restricted to logos and hardened separately.',
      'حاوية الملفات المهنية خاصة. وتُضبط المسارات وأنواع MIME والأحجام والصلاحيات؛ ويستخدم وصول العميل أذونات محددة أو روابط موقعة قصيرة. وتقتصر حاوية العلامة العامة على الشعارات وتُحصن بصورة منفصلة.',
    )]),
    section('secrets', text('4. Secrets et communications', '4. Secrets and communications', '4. الأسرار والاتصالات'), [text(
      'Les communications utilisent HTTPS/TLS. Les clés privilégiées et secrets fournisseurs ne sont jamais placés dans le frontend. Seules l’URL Supabase et la clé publique prévues pour le navigateur y sont exposées, sous protection RLS.',
      'Communications use HTTPS/TLS. Privileged keys and provider secrets are never placed in the frontend. Only the Supabase URL and browser-intended public key are exposed there, protected by RLS.',
      'تستخدم الاتصالات HTTPS/TLS. ولا توضع المفاتيح ذات الامتياز أو أسرار المزودين في الواجهة. ولا يظهر فيها إلا رابط Supabase والمفتاح العام المخصص للمتصفح تحت حماية RLS.',
    )]),
    section('continuity', text('5. Sauvegardes et continuité', '5. Backups and continuity', '5. النسخ الاحتياطية والاستمرارية'), [text(
      'Les sauvegardes et restaurations suivent les capacités du plan fournisseur et les procédures opérationnelles documentées. Aucun RPO, RTO ou niveau de disponibilité chiffré n’est promis sans engagement écrit spécifique.',
      'Backups and restores follow provider-plan capabilities and documented operational procedures. No numerical RPO, RTO or availability level is promised without a specific written commitment.',
      'تتبع النسخ الاحتياطية والاستعادة قدرات خطة المزود والإجراءات التشغيلية الموثقة. ولا يُعد بـRPO أو RTO أو مستوى توفر رقمي دون التزام كتابي محدد.',
    )]),
    section('incidents', text('6. Incidents et amélioration', '6. Incidents and improvement', '6. الحوادث والتحسين'), [text(
      'Les incidents sont qualifiés, contenus, documentés et notifiés selon leur nature et les rôles RGPD. Les vulnérabilités peuvent être signalées à anas.rodriguez@rodanbtech.com. Les mesures sont réévaluées selon les risques et les changements du service.',
      'Incidents are classified, contained, documented and notified according to their nature and GDPR roles. Vulnerabilities may be reported to anas.rodriguez@rodanbtech.com. Measures are reassessed as risks and the service change.',
      'تُصنف الحوادث وتُحتوى وتوثق ويُبلغ عنها وفق طبيعتها وأدوار GDPR. ويمكن الإبلاغ عن الثغرات إلى anas.rodriguez@rodanbtech.com. وتُعاد مراجعة التدابير بحسب المخاطر وتغيرات الخدمة.',
    )]),
  ],
}

const serviceLevels: LegalDocumentSource = {
  title: text('Annexe de service et support', 'Service and support schedule', 'ملحق الخدمة والدعم'),
  introduction: text(
    'Cette annexe complète le bon de commande sans créer de SLA numérique qui n’y serait pas expressément convenu.',
    'This schedule supplements the order form without creating a numerical SLA unless expressly agreed there.',
    'يكمل هذا الملحق أمر الشراء دون إنشاء SLA رقمي لم يُتفق عليه صراحة فيه.',
  ),
  sections: [
    section('availability', text('1. Disponibilité', '1. Availability', '1. التوفر'), [text(
      'RODANBTECH met en œuvre des moyens raisonnables pour maintenir le service. Les interruptions liées à la maintenance, la sécurité, un fournisseur, internet, un cas de force majeure ou un environnement client sont exclues de tout calcul convenu, selon le bon de commande.',
      'RODANBTECH uses reasonable measures to maintain the service. Interruptions caused by maintenance, security, a provider, the internet, force majeure or the customer environment are excluded from any agreed calculation as set out in the order form.',
      'تتخذ RODANBTECH تدابير معقولة للحفاظ على الخدمة. وتُستبعد من أي حساب متفق عليه الانقطاعات الناتجة عن الصيانة أو الأمن أو مزود أو الإنترنت أو القوة القاهرة أو بيئة العميل وفق أمر الشراء.',
    )]),
    section('maintenance', text('2. Maintenance', '2. Maintenance', '2. الصيانة'), [text(
      'Les maintenances susceptibles d’avoir un impact significatif sont annoncées lorsque cela est raisonnablement possible. Une intervention urgente de sécurité peut être réalisée sans préavis.',
      'Maintenance likely to have a material impact is announced where reasonably possible. Urgent security work may be performed without notice.',
      'يُعلن عن الصيانة التي يحتمل أن يكون لها أثر جوهري عندما يكون ذلك ممكنًا بصورة معقولة. ويمكن تنفيذ أعمال أمنية عاجلة دون إشعار.',
    )]),
    section('support', text('3. Support standard', '3. Standard support', '3. الدعم القياسي'), [text(
      'Le support standard est accessible à anas.rodriguez@rodanbtech.com les jours ouvrés. Un objectif de premier retour peut être indiqué dans le bon de commande ; il ne constitue pas un délai de résolution garanti sauf engagement écrit.',
      'Standard support is available at anas.rodriguez@rodanbtech.com on business days. An initial-response target may be stated in the order form; it is not a guaranteed resolution time unless agreed in writing.',
      'يتوفر الدعم القياسي عبر anas.rodriguez@rodanbtech.com في أيام العمل. ويمكن تحديد هدف للرد الأول في أمر الشراء؛ ولا يمثل وقت حل مضمونًا إلا باتفاق مكتوب.',
    )]),
    section('recovery', text('4. Sauvegarde et reprise', '4. Backup and recovery', '4. النسخ الاحتياطي والاستعادة'), [text(
      'Les modalités de sauvegarde, export et reprise dépendent du plan technique et du bon de commande. Les tests de restauration internes ne constituent pas une garantie contractuelle d’un RPO ou RTO non signé.',
      'Backup, export and recovery arrangements depend on the technical plan and order form. Internal restore tests do not create a contractual RPO or RTO that was not signed.',
      'تعتمد ترتيبات النسخ والتصدير والاستعادة على الخطة التقنية وأمر الشراء. ولا تنشئ اختبارات الاستعادة الداخلية RPO أو RTO تعاقديًا غير موقع.',
    )]),
    section('customer-duties', text('5. Coopération du client', '5. Customer cooperation', '5. تعاون العميل'), [text(
      'Le client fournit les informations nécessaires au diagnostic, maintient ses équipements et accès, désigne ses contacts et applique les contournements raisonnables. Le support ne remplace pas les responsabilités métier, juridiques ou techniques du garage.',
      'The customer provides information needed for diagnosis, maintains equipment and access, appoints contacts and applies reasonable workarounds. Support does not replace the garage’s business, legal or technical responsibilities.',
      'يوفر العميل المعلومات اللازمة للتشخيص ويحافظ على معداته ووصوله ويعين جهات الاتصال ويطبق الحلول المعقولة. ولا يحل الدعم محل مسؤوليات الورشة المهنية أو القانونية أو التقنية.',
    )]),
  ],
}

const aiPolicy: LegalDocumentSource = {
  title: text('Charte d’utilisation de l’intelligence artificielle', 'Artificial intelligence use policy', 'سياسة استخدام الذكاء الاصطناعي'),
  introduction: text(
    'Document interne préparatoire. Aucune fonctionnalité d’intelligence artificielle externe n’est active dans Clikarage.',
    'Internal preparatory document. No external artificial-intelligence feature is active in Clikarage.',
    'وثيقة داخلية تحضيرية. ولا توجد خاصية ذكاء اصطناعي خارجية نشطة في Clikarage.',
  ),
  sections: [
    section('inactive', text('1. État actuel', '1. Current status', '1. الوضع الحالي'), [text(
      'Le flag IA est désactivé. Aucun fournisseur IA ne reçoit les données client et aucune suggestion IA ne doit être présentée comme une fonctionnalité active.',
      'The AI flag is off. No AI provider receives customer data and no AI suggestion may be represented as an active feature.',
      'علم الذكاء الاصطناعي معطل. ولا يتلقى أي مزود ذكاء اصطناعي بيانات العملاء ولا يجوز عرض اقتراحات الذكاء الاصطناعي كخاصية نشطة.',
    )]),
    section('principles', text('2. Principes futurs', '2. Future principles', '2. المبادئ المستقبلية'), [text(
      'Toute activation future exige finalité, fournisseur, DPA, sécurité, minimisation, transparence, contrôle humain et tests documentés. Les données ne servent pas à entraîner un modèle généraliste sans accord écrit.',
      'Future activation requires documented purpose, provider, DPA, security, minimisation, transparency, human oversight and testing. Data is not used to train a general-purpose model without written agreement.',
      'يتطلب أي تفعيل لاحق غرضًا ومزودًا وDPA وأمنًا وتقليلًا وشفافية وإشرافًا بشريًا واختبارات موثقة. ولا تُستخدم البيانات لتدريب نموذج عام دون اتفاق مكتوب.',
    )]),
    section('human-control', text('3. Contrôle humain', '3. Human oversight', '3. الإشراف البشري'), [text(
      'Une sortie IA éventuelle reste une suggestion à vérifier. Elle ne constitue jamais un diagnostic mécanique, une expertise, une décision juridique, un prix garanti ou une instruction de sécurité.',
      'Any future AI output remains a suggestion to verify. It is never a mechanical diagnosis, expert opinion, legal decision, guaranteed price or safety instruction.',
      'تظل أي مخرجات ذكاء اصطناعي مستقبلية اقتراحًا يجب التحقق منه. ولا تمثل تشخيصًا ميكانيكيًا أو خبرة أو قرارًا قانونيًا أو سعرًا مضمونًا أو تعليمات أمنية.',
    )]),
  ],
}

function localized(source: LegalDocumentSource, lang: Lang): LocalizedCommercialLegalDocument {
  return {
    title: source.title[lang],
    introduction: source.introduction?.[lang],
    sections: source.sections.map((item) => ({
      id: item.id,
      title: item.title[lang],
      paragraphs: item.paragraphs.map((paragraph) => paragraph[lang]),
      items: item.items?.map((entry) => entry[lang]) ?? [],
    })),
  }
}

function dpa(lang: Lang): LocalizedCommercialLegalDocument {
  const document = getCommercialLegalDocument('dpa', lang)
  const intro = {
    fr: 'Cet accord encadre les traitements réalisés par RODANBTECH pour le compte du Client professionnel au titre de l’article 28 du RGPD. Il complète le contrat de service et doit être accepté uniquement par un représentant habilité de l’organisation.',
    en: 'This agreement governs processing carried out by RODANBTECH for the Professional Customer under Article 28 GDPR. It supplements the service agreement and must be accepted only by an authorised organisation representative.',
    ar: 'ينظم هذا الاتفاق المعالجة التي تنفذها RODANBTECH لحساب العميل المهني وفق المادة 28 من GDPR. وهو يكمل عقد الخدمة ولا يقبله إلا ممثل مخول للمؤسسة.',
  }
  return {
    ...document,
    introduction: intro[lang],
    sections: document.sections.map((item) => {
      if (item.id !== 'subprocessors') return item
      const replacement = localized(subprocessors, lang).sections.slice(0, 3)
      return {
        ...item,
        paragraphs: [
          lang === 'fr'
            ? 'Le Client professionnel donne une autorisation générale pour les prestataires actifs inscrits au registre contractuel. Tout ajout recevant des données métier est évalué et notifié selon le mécanisme convenu avant activation. Les garanties de transfert et entités contractantes sont vérifiées contre les contrats fournisseurs en vigueur.'
            : lang === 'en'
              ? 'The Professional Customer gives general authorisation for active providers in the contractual register. Any addition receiving business data is assessed and notified under the agreed mechanism before activation. Transfer safeguards and contracting entities are checked against current provider agreements.'
              : 'يمنح العميل المهني تفويضًا عامًا للمزودين النشطين في السجل التعاقدي. ويُقيّم أي مزود جديد يتلقى بيانات مهنية ويُبلغ عنه وفق الآلية المتفق عليها قبل التفعيل. وتُراجع ضمانات النقل والكيانات المتعاقدة وفق عقود المزودين السارية.',
          ...replacement.flatMap((entry) => entry.paragraphs),
        ],
      }
    }),
  }
}

function termsPro(lang: Lang): LocalizedCommercialLegalDocument {
  const document = getCommercialLegalDocument('terms', lang)
  const additions = localized({
    title: text('', '', ''),
    sections: [
      section('late-payment', text('19. Retard de paiement', '19. Late payment', '19. التأخر في الدفع'), [text(
        'Toute somme impayée à l’échéance porte les pénalités prévues par le bon de commande et au minimum celles imposées entre professionnels. L’indemnité forfaitaire légale de 40 euros pour frais de recouvrement est due, sans préjudice des frais supplémentaires justifiés. Une suspension proportionnée peut intervenir après la procédure prévue au contrat.',
        'Any overdue amount bears the penalties stated in the order form and at least those required between businesses. The statutory EUR 40 fixed recovery charge is due, without prejudice to justified additional costs. Proportionate suspension may follow the contractual process.',
        'تخضع المبالغ غير المدفوعة عند الاستحقاق للغرامات المحددة في أمر الشراء وبحد أدنى ما يفرض بين المهنيين. ويستحق التعويض القانوني الثابت البالغ 40 يورو لتكاليف التحصيل دون الإخلال بالتكاليف الإضافية المثبتة. ويمكن التعليق المتناسب بعد الإجراء التعاقدي.',
      )]),
      section('confidentiality', text('20. Confidentialité', '20. Confidentiality', '20. السرية'), [text(
        'Chaque partie protège les informations non publiques reçues pour exécuter le contrat. Cette obligation subsiste pendant cinq ans après la fin du contrat et aussi longtemps que nécessaire pour les secrets d’affaires, secrets d’accès et données personnelles.',
        'Each party protects non-public information received to perform the agreement. This duty survives for five years after termination and as long as necessary for trade secrets, access secrets and personal data.',
        'يحمي كل طرف المعلومات غير العامة التي يتلقاها لتنفيذ العقد. ويستمر هذا الالتزام خمس سنوات بعد انتهاء العقد وطالما يلزم بالنسبة للأسرار التجارية وأسرار الوصول والبيانات الشخصية.',
      )]),
      section('force-majeure', text('21. Force majeure', '21. Force majeure', '21. القوة القاهرة'), [text(
        'Aucune partie n’est responsable d’un manquement causé par un événement hors de son contrôle répondant aux conditions légales de force majeure. Elle informe l’autre partie, limite les conséquences et reprend l’exécution dès que possible. Le bon de commande précise les conséquences d’un empêchement prolongé.',
        'Neither party is liable for failure caused by an event beyond its control meeting the legal requirements of force majeure. It informs the other party, limits consequences and resumes performance as soon as possible. The order form states the effect of prolonged prevention.',
        'لا يتحمل أي طرف مسؤولية إخفاق سببه حدث خارج سيطرته يستوفي الشروط القانونية للقوة القاهرة. ويبلغ الطرف الآخر ويحد من الآثار ويستأنف التنفيذ في أقرب وقت. ويحدد أمر الشراء أثر استمرار المانع.',
      )]),
    ],
  }, lang).sections
  return { ...document, title: lang === 'fr' ? 'Conditions générales de services et d’abonnement B2B' : lang === 'en' ? 'B2B service and subscription terms' : 'الشروط العامة للخدمات والاشتراك بين المهنيين', sections: [...document.sections, ...additions] }
}

export function getLegalV2Document(documentId: LegalV2DocumentId, lang: Lang): LocalizedCommercialLegalDocument {
  switch (documentId) {
    case 'legal': return localized(legal, lang)
    case 'terms_pro': return termsPro(lang)
    case 'terms_client': return localized(termsClient, lang)
    case 'privacy': return localized(privacy, lang)
    case 'cookies': return localized(cookies, lang)
    case 'dpa': return dpa(lang)
    case 'subprocessors': return localized(subprocessors, lang)
    case 'security': return localized(security, lang)
    case 'service_levels': return localized(serviceLevels, lang)
    case 'ai_policy': return localized(aiPolicy, lang)
  }
}

export function serializeLegalV2Document(documentId: LegalV2DocumentId, lang: Lang) {
  return JSON.stringify(getLegalV2Document(documentId, lang))
}

export const LEGAL_V2_SOURCE_DOCUMENTS = {
  legal,
  termsClient,
  privacy,
  cookies,
  subprocessors,
  security,
  serviceLevels,
  aiPolicy,
  termsPro: commercialLegalContent.terms,
  dpa: commercialLegalContent.dpa,
}
