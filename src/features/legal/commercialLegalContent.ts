import type { Lang } from '@/i18n'

export type CommercialLegalDocumentKey = 'legal' | 'privacy' | 'terms' | 'dpa'

export type LocalizedText = Record<Lang, string>

export interface LegalSectionSource {
  id: string
  title: LocalizedText
  paragraphs: LocalizedText[]
  items?: LocalizedText[]
}

export interface LegalDocumentSource {
  title: LocalizedText
  introduction?: LocalizedText
  sections: LegalSectionSource[]
}

export const legalText = (fr: string, en: string, ar: string): LocalizedText => ({ fr, en, ar })
const text = legalText

export const commercialLegalContent: Record<CommercialLegalDocumentKey, LegalDocumentSource> = {
  legal: {
    title: text('Mentions légales', 'Legal notice', 'الإشعار القانوني'),
    introduction: text(
      'Clikarage est un service édité par RODANBTECH.',
      'Clikarage is a service published by RODANBTECH.',
      'Clikarage خدمة تنشرها RODANBTECH.',
    ),
    sections: [
      {
        id: 'publisher',
        title: text('1. Éditeur et directeur de publication', '1. Publisher and publication director', '1. الناشر ومدير النشر'),
        paragraphs: [text(
          'Le service Clikarage est édité par Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel, exerçant sous le nom commercial RODANBTECH. Le directeur de la publication est Anas RODRIGUEZ BENKARROUM. Clikarage désigne le produit logiciel et ne constitue pas une personne morale distincte.',
          'The Clikarage service is published by Anas RODRIGUEZ BENKARROUM, a French sole trader operating under the trading name RODANBTECH. The publication director is Anas RODRIGUEZ BENKARROUM. Clikarage is the software product name and is not a separate legal entity.',
          'تنشر خدمة Clikarage مؤسسة Anas RODRIGUEZ BENKARROUM الفردية التي تمارس نشاطها تحت الاسم التجاري RODANBTECH. ومدير النشر هو Anas RODRIGUEZ BENKARROUM. وClikarage هو اسم المنتج البرمجي وليس شخصًا اعتباريًا مستقلاً.',
        )],
      },
      {
        id: 'hosting',
        title: text('2. Hébergement et prestataires techniques', '2. Hosting and technical providers', '2. الاستضافة ومقدمو الخدمات التقنية'),
        paragraphs: [
          text(
            'L’interface web est hébergée par Vercel Inc. La base de données, l’authentification et le stockage technique sont fournis par Supabase, avec une base principale configurée dans la région eu-west-3 (Paris). Squarespace sert à administrer le domaine et le DNS, et éventuellement le site vitrine ; Google Workspace sert à la messagerie professionnelle. Ces usages administratifs ne signifient pas que ces services reçoivent toutes les données Clikarage. Leurs rôles contractuels exacts doivent être confirmés avant l’entrée en vigueur.',
            'The web interface is hosted by Vercel Inc. Database, authentication and technical storage services are provided by Supabase, with the primary database configured in the eu-west-3 (Paris) region. Squarespace is used to administer the domain and DNS, and potentially the showcase site; Google Workspace is used for professional email. These administrative uses do not mean that those services receive all Clikarage data. Their exact contractual roles must be confirmed before effectiveness.',
            'تستضيف Vercel Inc. واجهة الويب. وتوفر Supabase قاعدة البيانات والمصادقة والتخزين التقني، مع إعداد قاعدة البيانات الرئيسية في منطقة eu-west-3 (باريس). ويُستخدم Squarespace لإدارة النطاق وDNS وربما الموقع التعريفي، بينما يُستخدم Google Workspace للبريد المهني. ولا تعني هذه الاستخدامات الإدارية أن هذه الخدمات تتلقى جميع بيانات Clikarage. ويجب تأكيد أدوارها التعاقدية الدقيقة قبل دخول النص حيز النفاذ.',
          ),
          text(
            'Les rôles précis de ces prestataires, les éventuels transferts et les garanties applicables sont détaillés dans la Politique de confidentialité et, pour les clients professionnels, dans l’Accord de sous-traitance.',
            'The precise roles of these providers, any transfers and applicable safeguards are described in the Privacy policy and, for professional customers, in the Data processing agreement.',
            'توضح سياسة الخصوصية، وكذلك اتفاق معالجة البيانات للعملاء المهنيين، الأدوار الدقيقة لهؤلاء المزودين وأي عمليات نقل وضماناتها.',
          ),
        ],
      },
      {
        id: 'intellectual-property',
        title: text('3. Propriété intellectuelle', '3. Intellectual property', '3. الملكية الفكرية'),
        paragraphs: [text(
          'La structure, les interfaces, les textes éditoriaux, les éléments graphiques, les marques et le logiciel Clikarage sont protégés par les droits applicables. Aucun droit de propriété n’est transféré à l’utilisateur. Toute reproduction, extraction, adaptation ou réutilisation non autorisée est interdite, sous réserve des droits expressément accordés par un contrat ou par la loi.',
          'The structure, interfaces, editorial text, graphic elements, trademarks and Clikarage software are protected by applicable rights. No ownership right is transferred to the user. Unauthorised reproduction, extraction, adaptation or reuse is prohibited, subject to rights expressly granted by contract or law.',
          'يحمي القانون بنية Clikarage وواجهاته ونصوصه التحريرية وعناصره الرسومية وعلاماته وبرمجياته. ولا تنتقل إلى المستخدم أي حقوق ملكية. ويُحظر النسخ أو الاستخراج أو التعديل أو إعادة الاستخدام دون إذن، مع مراعاة الحقوق الممنوحة صراحةً بموجب عقد أو قانون.',
        )],
      },
      {
        id: 'role-liability',
        title: text('4. Rôle du service et responsabilité générale', '4. Service role and general liability', '4. دور الخدمة والمسؤولية العامة'),
        paragraphs: [
          text(
            'Clikarage fournit un outil de gestion de l’expérience client après-vente automobile. RODANBTECH n’agit pas, par ce seul service, comme réparateur, expert automobile, assureur, intermédiaire de paiement, conseiller juridique ou comptable. Le garage demeure responsable de ses diagnostics, devis, prix, travaux, délais, garanties, obligations professionnelles et relations avec ses clients.',
            'Clikarage provides an automotive after-sales customer-experience management tool. Through this service alone, RODANBTECH does not act as a repairer, vehicle expert, insurer, payment intermediary, legal adviser or accountant. The garage remains responsible for its diagnoses, quotes, prices, work, timescales, warranties, professional duties and customer relationships.',
            'يوفر Clikarage أداة لإدارة تجربة العملاء في خدمات ما بعد البيع للسيارات. ولا تعمل RODANBTECH بمجرد تقديم هذه الخدمة كمصلح سيارات أو خبير مركبات أو شركة تأمين أو وسيط دفع أو مستشار قانوني أو محاسبي. وتظل الورشة مسؤولة عن التشخيصات والعروض والأسعار والأعمال والمواعيد والضمانات والالتزامات المهنية وعلاقتها بعملائها.',
          ),
          text(
            'RODANBTECH met en œuvre des moyens raisonnables pour exploiter et sécuriser le service, sans promettre une disponibilité ininterrompue, une absence totale d’erreurs ou une adéquation à tous les usages. Les limites contractuelles applicables sont précisées dans les Conditions d’utilisation ou dans le contrat conclu avec le client professionnel, sans écarter les dispositions impératives.',
            'RODANBTECH uses reasonable measures to operate and secure the service, without promising uninterrupted availability, complete absence of errors or suitability for every use. Applicable contractual limitations are set out in the Terms of use or the agreement with the professional customer, without excluding mandatory law.',
            'تتخذ RODANBTECH تدابير معقولة لتشغيل الخدمة وتأمينها، من دون التعهد بتوفر متواصل أو انعدام كامل للأخطاء أو ملاءمة كل استخدام. وترد الحدود التعاقدية المطبقة في شروط الاستخدام أو في العقد المبرم مع العميل المهني، من دون استبعاد الأحكام القانونية الآمرة.',
          ),
        ],
      },
      {
        id: 'privacy-contracts',
        title: text('5. Données personnelles et documents contractuels', '5. Personal data and contractual documents', '5. البيانات الشخصية والمستندات التعاقدية'),
        paragraphs: [text(
          'La Politique de confidentialité décrit les traitements réalisés par RODANBTECH. Les Conditions d’utilisation encadrent l’accès au service. L’Accord de sous-traitance précise les obligations applicables lorsque RODANBTECH traite des données pour le compte d’un garage. Les versions contractuelles antérieures restent archivées uniquement pour préserver les preuves historiques.',
          'The Privacy policy describes processing carried out by RODANBTECH. The Terms of use govern access to the service. The Data processing agreement specifies the obligations that apply when RODANBTECH processes data for a garage. Previous contractual versions remain archived solely to preserve historical evidence.',
          'توضح سياسة الخصوصية عمليات المعالجة التي تقوم بها RODANBTECH. وتنظم شروط الاستخدام الوصول إلى الخدمة. ويحدد اتفاق معالجة البيانات الالتزامات المطبقة عندما تعالج RODANBTECH البيانات لحساب ورشة. وتبقى الإصدارات التعاقدية السابقة مؤرشفة فقط للحفاظ على الأدلة التاريخية.',
        )],
      },
      {
        id: 'contact',
        title: text('6. Contact et signalement', '6. Contact and notices', '6. الاتصال والإبلاغ'),
        paragraphs: [text(
          'Toute question relative au service, à un contenu ou à un signalement peut être adressée aux coordonnées officielles figurant sur cette page. Les demandes relatives aux données personnelles doivent utiliser le contact confidentialité.',
          'Questions about the service, content or a notice may be sent using the official contact details on this page. Personal-data requests should use the privacy contact.',
          'يمكن إرسال الأسئلة المتعلقة بالخدمة أو المحتوى أو البلاغات عبر بيانات الاتصال الرسمية الواردة في هذه الصفحة. وينبغي توجيه طلبات البيانات الشخصية إلى جهة اتصال الخصوصية.',
        )],
      },
    ],
  },

  terms: {
    title: text('Conditions d’utilisation et de service', 'Terms of use and service', 'شروط الاستخدام والخدمة'),
    introduction: text(
      'Ces conditions encadrent l’accès à Clikarage par les clients professionnels, leurs utilisateurs et les automobilistes disposant d’un accès limité à leur dossier.',
      'These terms govern access to Clikarage by professional customers, their users and motorists with limited access to their service record.',
      'تنظم هذه الشروط الوصول إلى Clikarage من قبل العملاء المهنيين ومستخدميهم وأصحاب المركبات الذين لديهم وصول محدود إلى ملفاتهم.',
    ),
    sections: [
      {
        id: 'scope-definitions',
        title: text('1. Objet, parties et définitions', '1. Purpose, parties and definitions', '1. الغرض والأطراف والتعريفات'),
        paragraphs: [text(
          'Clikarage est un service logiciel édité par RODANBTECH. Le « Client professionnel » est le garage, groupe, concession, franchise ou réseau qui contracte avec RODANBTECH. Les « Utilisateurs professionnels » sont ses collaborateurs autorisés. L’« Automobiliste » est la personne qui consulte ou alimente un dossier, demande un rendez-vous ou répond à une proposition du garage.',
          'Clikarage is software published by RODANBTECH. The “Professional Customer” is the garage, group, dealership, franchise or network contracting with RODANBTECH. “Professional Users” are its authorised staff. The “Motorist” is the person who views or contributes to a service record, requests an appointment or responds to a garage proposal.',
          'Clikarage برنامج تنشره RODANBTECH. ويُقصد بـ«العميل المهني» الورشة أو المجموعة أو الوكالة أو الامتياز أو الشبكة التي تتعاقد مع RODANBTECH. و«المستخدمون المهنيون» هم العاملون المخولون لديها. و«صاحب المركبة» هو الشخص الذي يطّلع على ملف صيانة أو يضيف إليه أو يطلب موعدًا أو يرد على اقتراح من الورشة.',
        )],
      },
      {
        id: 'contract-documents',
        title: text('2. Documents contractuels, version et acceptation', '2. Contract documents, version and acceptance', '2. المستندات التعاقدية والإصدار والقبول'),
        paragraphs: [
          text(
            'Le contrat applicable peut comprendre une proposition commerciale, un bon de commande ou abonnement, les présentes conditions, la Politique de confidentialité et, lorsque nécessaire, l’Accord de sous-traitance. En cas de contradiction, le document négocié ou signé prévaut sur les conditions générales pour son objet propre.',
            'The applicable contract may include a commercial proposal, order form or subscription, these terms, the Privacy policy and, where required, the Data processing agreement. If documents conflict, the negotiated or signed document prevails over these general terms for its specific subject matter.',
            'قد يشمل العقد المطبق عرضًا تجاريًا أو طلب شراء أو اشتراكًا وهذه الشروط وسياسة الخصوصية، وعند الحاجة اتفاق معالجة البيانات. وفي حال التعارض، يسود المستند المتفاوض عليه أو الموقع على الشروط العامة في موضوعه الخاص.',
          ),
          text(
            'L’acceptation est explicite et rattachée à une version identifiable. Une modification substantielle peut nécessiter une nouvelle acceptation. Aucune ancienne acceptation n’est réécrite.',
            'Acceptance is explicit and linked to an identifiable version. A material change may require renewed acceptance. Previous acceptance records are never rewritten.',
            'يكون القبول صريحًا ومرتبطًا بإصدار قابل للتحديد. وقد يتطلب أي تعديل جوهري قبولًا جديدًا. ولا يُعاد أبدًا تعديل سجلات القبول السابقة.',
          ),
        ],
      },
      {
        id: 'service',
        title: text('3. Fonctionnalités et rôle de Clikarage', '3. Features and role of Clikarage', '3. وظائف Clikarage ودوره'),
        paragraphs: [text(
          'Selon l’offre et les modules activés, Clikarage peut gérer rendez-vous, dépôts de véhicule, étapes atelier, diagnostics rédigés par le garage, recommandations, devis, décisions client, pièces jointes, rapports de restitution, rappels et tableaux de bord. Clikarage transmet et organise les informations saisies; il ne produit pas lui-même de diagnostic automobile et ne décide pas des réparations.',
          'Depending on the plan and enabled modules, Clikarage may manage appointments, vehicle check-in, workshop stages, garage-authored diagnoses, recommendations, quotes, customer decisions, attachments, handover reports, reminders and dashboards. Clikarage transmits and organises submitted information; it does not itself diagnose vehicles or decide on repairs.',
          'بحسب العرض والوحدات المفعلة، يمكن لـClikarage إدارة المواعيد واستلام المركبات ومراحل الورشة والتشخيصات التي تكتبها الورشة والتوصيات والعروض وقرارات العميل والمرفقات وتقارير التسليم والتذكيرات ولوحات المتابعة. وينقل Clikarage المعلومات المدخلة وينظمها، لكنه لا يشخص المركبات بنفسه ولا يقرر الإصلاحات.',
        )],
      },
      {
        id: 'accounts',
        title: text('4. Comptes, rôles et sécurité', '4. Accounts, roles and security', '4. الحسابات والأدوار والأمن'),
        paragraphs: [text(
          'Chaque utilisateur doit fournir des informations exactes, utiliser un compte personnel, protéger ses identifiants et signaler sans délai tout accès suspect. Le Client professionnel attribue les rôles appropriés, retire les accès devenus inutiles et veille à ce que ses utilisateurs respectent le contrat. Les identifiants ne doivent pas être partagés.',
          'Each user must provide accurate information, use an individual account, protect credentials and promptly report suspicious access. The Professional Customer assigns appropriate roles, removes unnecessary access and ensures its users comply with the contract. Credentials must not be shared.',
          'يجب على كل مستخدم تقديم معلومات صحيحة واستخدام حساب فردي وحماية بيانات الدخول والإبلاغ فورًا عن أي وصول مشبوه. ويعين العميل المهني الأدوار المناسبة ويلغي الصلاحيات غير اللازمة ويضمن التزام مستخدميه بالعقد. ولا يجوز مشاركة بيانات الدخول.',
        )],
      },
      {
        id: 'professional-duties',
        title: text('5. Obligations du Client professionnel', '5. Professional Customer obligations', '5. التزامات العميل المهني'),
        paragraphs: [text(
          'Le Client professionnel demeure seul responsable de son activité automobile, de la licéité et de l’exactitude des données saisies, de ses prix et délais, des diagnostics, devis, réparations, garanties, obligations d’information, assurances, autorisations et relations commerciales. Il vérifie les documents avant envoi et n’utilise le service que pour des finalités licites.',
          'The Professional Customer remains solely responsible for its automotive business, the lawfulness and accuracy of submitted data, prices and timescales, diagnoses, quotes, repairs, warranties, disclosure duties, insurance, authorisations and commercial relationships. It checks documents before sending and uses the service only for lawful purposes.',
          'يبقى العميل المهني وحده مسؤولًا عن نشاطه في مجال السيارات وعن مشروعية البيانات المدخلة ودقتها وعن الأسعار والمواعيد والتشخيصات والعروض والإصلاحات والضمانات وواجبات الإعلام والتأمينات والتراخيص والعلاقات التجارية. ويتحقق من المستندات قبل إرسالها ولا يستخدم الخدمة إلا لأغراض مشروعة.',
        )],
      },
      {
        id: 'motorists',
        title: text('6. Accès des automobilistes', '6. Motorist access', '6. وصول أصحاب المركبات'),
        paragraphs: [text(
          'L’Automobiliste dispose d’un accès limité aux dossiers qui le concernent. Il fournit des informations exactes, protège son compte ou ses liens d’accès, lit les documents avant de répondre et ne tente pas d’accéder au dossier d’un tiers. Sa relation de réparation, de devis et de garantie est conclue avec le garage concerné, non avec RODANBTECH.',
          'The Motorist has limited access to relevant service records. They provide accurate information, protect their account or access links, read documents before responding and must not attempt to access another person’s record. Their repair, quotation and warranty relationship is with the relevant garage, not RODANBTECH.',
          'يملك صاحب المركبة وصولًا محدودًا إلى الملفات التي تخصه. ويقدم معلومات صحيحة ويحمي حسابه أو روابط الوصول ويقرأ المستندات قبل الرد ولا يحاول الوصول إلى ملف شخص آخر. وتكون علاقة الإصلاح والعرض والضمان مع الورشة المعنية وليس مع RODANBTECH.',
        )],
      },
      {
        id: 'data',
        title: text('7. Données, contenus et pièces jointes', '7. Data, content and attachments', '7. البيانات والمحتوى والمرفقات'),
        paragraphs: [text(
          'Le Client professionnel conserve ses droits sur les données et contenus qu’il fournit et autorise leur traitement dans la mesure nécessaire au service. Il s’assure de disposer d’une base légale et des droits nécessaires, notamment pour les données clients, véhicules, photographies, documents et messages. Les contenus illicites, malveillants, excessifs ou sans lien avec le service sont interdits.',
          'The Professional Customer retains rights in supplied data and content and authorises processing as required to provide the service. It ensures that it has an appropriate legal basis and necessary rights, particularly for customer and vehicle data, photographs, documents and messages. Unlawful, malicious, excessive or unrelated content is prohibited.',
          'يحتفظ العميل المهني بحقوقه في البيانات والمحتوى الذي يقدمه ويصرح بمعالجته بالقدر اللازم لتقديم الخدمة. ويضمن وجود أساس قانوني وحقوق لازمة، ولا سيما لبيانات العملاء والمركبات والصور والمستندات والرسائل. ويُحظر المحتوى غير المشروع أو الضار أو المفرط أو غير المرتبط بالخدمة.',
        )],
      },
      {
        id: 'quotes-decisions',
        title: text('8. Devis, recommandations et décisions', '8. Quotes, recommendations and decisions', '8. العروض والتوصيات والقرارات'),
        paragraphs: [text(
          'Les devis, recommandations, estimations et messages sont établis sous la responsabilité du garage. Clikarage enregistre et transmet les réponses disponibles, sans se substituer aux obligations de consentement, d’information ou de preuve du garage. Une réponse horodatée dans le service ne remplace pas un formalisme légal particulier lorsqu’il est requis.',
          'Quotes, recommendations, estimates and messages are prepared under the garage’s responsibility. Clikarage records and transmits available responses without replacing the garage’s consent, disclosure or evidence obligations. A timestamped response in the service does not replace a specific legal form where one is required.',
          'تُعد العروض والتوصيات والتقديرات والرسائل تحت مسؤولية الورشة. ويسجل Clikarage الردود المتاحة وينقلها من دون أن يحل محل التزامات الورشة المتعلقة بالموافقة أو الإعلام أو الإثبات. ولا يحل الرد المؤرخ داخل الخدمة محل شكل قانوني خاص عندما يكون مطلوبًا.',
        )],
      },
      {
        id: 'financial',
        title: text('9. Conditions financières', '9. Financial terms', '9. الشروط المالية'),
        paragraphs: [text(
          'Les prix, périodicités, limites d’usage et modalités de paiement sont définis dans l’offre commerciale ou le bon de commande. Clikarage n’agit pas comme intermédiaire de paiement entre le garage et l’automobiliste. Un défaut de paiement peut entraîner une suspension dans les conditions prévues au contrat, après les notifications applicables.',
          'Prices, billing periods, usage limits and payment arrangements are defined in the commercial proposal or order form. Clikarage does not act as a payment intermediary between the garage and motorist. Non-payment may lead to suspension under the contract after applicable notices.',
          'تحدد الأسعار ودورات الفوترة وحدود الاستخدام وطرق الدفع في العرض التجاري أو طلب الشراء. ولا يعمل Clikarage كوسيط دفع بين الورشة وصاحب المركبة. وقد يؤدي عدم الدفع إلى تعليق الخدمة وفق العقد وبعد الإشعارات المطبقة.',
        )],
      },
      {
        id: 'availability',
        title: text('10. Disponibilité, maintenance et évolution', '10. Availability, maintenance and changes', '10. التوفر والصيانة والتطوير'),
        paragraphs: [text(
          'RODANBTECH met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du service. Des interruptions peuvent résulter de la maintenance, d’une mise à jour, d’un incident, d’un prestataire ou d’un cas de force majeure. Aucun niveau de service garanti ne s’applique sauf engagement écrit distinct. Les fonctions peuvent évoluer, sous réserve de ne pas priver le Client professionnel des caractéristiques essentielles convenues sans mesure appropriée.',
          'RODANBTECH uses reasonable measures to maintain service availability and security. Interruptions may result from maintenance, updates, incidents, providers or force majeure. No guaranteed service level applies unless separately agreed in writing. Features may evolve, provided the Professional Customer is not deprived of agreed essential characteristics without appropriate measures.',
          'تتخذ RODANBTECH تدابير معقولة للحفاظ على توفر الخدمة وأمنها. وقد تنتج الانقطاعات عن الصيانة أو التحديث أو الحوادث أو أحد المزودين أو القوة القاهرة. ولا يطبق مستوى خدمة مضمون ما لم يوجد التزام كتابي مستقل. ويمكن تطوير الوظائف بشرط عدم حرمان العميل المهني من الخصائص الأساسية المتفق عليها من دون تدبير مناسب.',
        )],
      },
      {
        id: 'support',
        title: text('11. Support et signalement', '11. Support and reporting', '11. الدعم والإبلاغ'),
        paragraphs: [text(
          'Le support est fourni selon le canal et le niveau prévus dans l’offre. L’utilisateur fournit les éléments utiles à la reproduction d’un incident sans transmettre inutilement de données personnelles ou de secrets. Les incidents de sécurité présumés doivent être signalés rapidement au contact officiel.',
          'Support is provided through the channel and service level stated in the plan. Users provide information needed to reproduce an issue without unnecessarily sending personal data or secrets. Suspected security incidents must be promptly reported to the official contact.',
          'يُقدم الدعم عبر القناة والمستوى المحددين في العرض. ويقدم المستخدم المعلومات اللازمة لإعادة إنتاج المشكلة من دون إرسال بيانات شخصية أو أسرار بلا حاجة. ويجب الإبلاغ سريعًا عن حوادث الأمن المشتبه بها إلى جهة الاتصال الرسمية.',
        )],
      },
      {
        id: 'licence',
        title: text('12. Licence et propriété intellectuelle', '12. Licence and intellectual property', '12. الترخيص والملكية الفكرية'),
        paragraphs: [text(
          'Pendant la durée du contrat, RODANBTECH accorde au Client professionnel un droit limité, non exclusif, non cessible et non transférable d’utiliser Clikarage pour ses besoins internes autorisés. Toute extraction massive, contournement de sécurité, revente non autorisée, décompilation abusive ou atteinte aux droits de propriété intellectuelle est interdite.',
          'For the contract term, RODANBTECH grants the Professional Customer a limited, non-exclusive, non-assignable and non-transferable right to use Clikarage for authorised internal needs. Mass extraction, security circumvention, unauthorised resale, abusive decompilation or infringement of intellectual-property rights is prohibited.',
          'طوال مدة العقد تمنح RODANBTECH العميل المهني حقًا محدودًا وغير حصري وغير قابل للتنازل أو النقل لاستخدام Clikarage لحاجاته الداخلية المصرح بها. ويُحظر الاستخراج الجماعي أو تجاوز الأمن أو إعادة البيع دون إذن أو فك البرمجيات بصورة مسيئة أو انتهاك حقوق الملكية الفكرية.',
        )],
      },
      {
        id: 'suspension',
        title: text('13. Suspension', '13. Suspension', '13. التعليق'),
        paragraphs: [text(
          'RODANBTECH peut suspendre tout ou partie de l’accès en cas de risque de sécurité, usage illicite, violation grave ou répétée, injonction légale, atteinte à un tiers, impayé contractuellement établi ou nécessité urgente de protéger le service. Lorsque la situation le permet, le Client professionnel est informé et peut remédier au manquement.',
          'RODANBTECH may suspend all or part of access for a security risk, unlawful use, serious or repeated breach, legal order, third-party harm, contractually established non-payment or urgent need to protect the service. Where circumstances allow, the Professional Customer is informed and may remedy the breach.',
          'يجوز لـRODANBTECH تعليق الوصول كليًا أو جزئيًا عند وجود خطر أمني أو استخدام غير مشروع أو مخالفة جسيمة أو متكررة أو أمر قانوني أو ضرر للغير أو عدم دفع ثابت تعاقديًا أو حاجة عاجلة لحماية الخدمة. وعندما تسمح الظروف، يُبلغ العميل المهني ويمكنه معالجة المخالفة.',
        )],
      },
      {
        id: 'termination',
        title: text('14. Durée, résiliation et fin d’accès', '14. Term, termination and end of access', '14. المدة والفسخ وانتهاء الوصول'),
        paragraphs: [text(
          'La durée et les modalités de résiliation figurent dans l’offre applicable. La fin du contrat entraîne la fermeture des accès à l’issue du délai convenu, sous réserve des obligations légales, des opérations de restitution et des sauvegardes techniques temporaires. Les clauses destinées à survivre à la fin du contrat restent applicables.',
          'The term and termination arrangements are stated in the applicable plan. At contract end, access closes after the agreed period, subject to legal obligations, data-return operations and temporary technical backups. Provisions intended to survive termination remain effective.',
          'ترد مدة العقد وترتيبات فسخه في العرض المطبق. ويؤدي انتهاء العقد إلى إغلاق الوصول بعد المهلة المتفق عليها، مع مراعاة الالتزامات القانونية وعمليات إعادة البيانات والنسخ الاحتياطية التقنية المؤقتة. وتبقى الأحكام المعدة للاستمرار بعد انتهاء العقد نافذة.',
        )],
      },
      {
        id: 'export',
        title: text('15. Export, restitution et suppression des données', '15. Data export, return and deletion', '15. تصدير البيانات وإعادتها وحذفها'),
        paragraphs: [text(
          'Sur demande raisonnable présentée avant la fin du délai contractuel, RODANBTECH fournit les exports disponibles dans un format couramment exploitable, selon le périmètre et les modalités de l’offre. Les données sont ensuite supprimées ou anonymisées conformément aux instructions licites, aux obligations de conservation et aux cycles de sauvegarde. Les objets relevant d’autres responsables de traitement ne sont pas restitués à un tiers non autorisé.',
          'On reasonable request made before the contractual deadline, RODANBTECH provides available exports in a commonly usable format, according to the plan’s scope and arrangements. Data is then deleted or anonymised in line with lawful instructions, retention duties and backup cycles. Data controlled by others is not returned to an unauthorised third party.',
          'بناءً على طلب معقول يقدم قبل انتهاء المهلة التعاقدية، توفر RODANBTECH الصادرات المتاحة بصيغة قابلة للاستخدام عادةً وفق نطاق العرض وترتيباته. ثم تُحذف البيانات أو تُخفى هويتها وفق التعليمات المشروعة والتزامات الاحتفاظ ودورات النسخ الاحتياطي. ولا تُعاد البيانات التي يتحكم فيها مسؤول آخر إلى طرف غير مخول.',
        )],
      },
      {
        id: 'liability',
        title: text('16. Responsabilité', '16. Liability', '16. المسؤولية'),
        paragraphs: [
          text(
            'Chaque partie répond des dommages directs prouvés résultant de ses manquements, dans les limites du droit applicable et du contrat conclu. RODANBTECH ne répond pas des décisions, saisies, diagnostics, devis, travaux, retards, garanties ou relations commerciales relevant du garage, ni d’un usage contraire aux instructions.',
            'Each party is responsible for proven direct loss caused by its breach, subject to applicable law and the agreed contract. RODANBTECH is not responsible for decisions, entries, diagnoses, quotes, work, delays, warranties or commercial relationships controlled by the garage, or for use contrary to instructions.',
            'يتحمل كل طرف مسؤولية الضرر المباشر المثبت الناتج عن إخلاله، ضمن حدود القانون والعقد المبرم. ولا تتحمل RODANBTECH مسؤولية القرارات أو البيانات المدخلة أو التشخيصات أو العروض أو الأعمال أو التأخيرات أو الضمانات أو العلاقات التجارية التي تدخل في مسؤولية الورشة، ولا الاستخدام المخالف للتعليمات.',
          ),
          text(
            'Aucune stipulation ne limite une responsabilité qui ne peut légalement l’être, notamment en cas de faute lourde ou dolosive lorsque le droit applicable l’impose. Toute limitation financière spécifique doit figurer dans l’offre ou le contrat validé avec le Client professionnel.',
            'Nothing limits liability that cannot lawfully be limited, including gross negligence or wilful misconduct where applicable law so requires. Any specific financial cap must appear in the plan or agreement approved with the Professional Customer.',
            'لا يحد أي حكم من مسؤولية لا يجوز قانونًا تقييدها، بما في ذلك الخطأ الجسيم أو العمدي عندما يفرض القانون ذلك. ويجب أن يرد أي حد مالي خاص في العرض أو العقد المعتمد مع العميل المهني.',
          ),
        ],
      },
      {
        id: 'law',
        title: text('17. Droit applicable et règlement des litiges', '17. Governing law and disputes', '17. القانون المطبق وتسوية النزاعات'),
        paragraphs: [text(
          'Le contrat est soumis au droit français. Les parties recherchent d’abord une solution amiable. Pour un litige entre professionnels, la juridiction compétente est déterminée par le contrat négocié et les règles impératives applicables. Les droits impératifs d’un automobiliste agissant comme consommateur ne sont pas écartés.',
          'The contract is governed by French law. The parties first seek an amicable solution. For disputes between professionals, jurisdiction is determined by the negotiated agreement and mandatory rules. Mandatory rights of a motorist acting as a consumer are not excluded.',
          'يخضع العقد للقانون الفرنسي. ويسعى الطرفان أولًا إلى حل ودي. وفي النزاعات بين المهنيين تحدد المحكمة المختصة وفق العقد المتفاوض عليه والقواعد الآمرة. ولا تُستبعد الحقوق الآمرة لصاحب المركبة عندما يتصرف كمستهلك.',
        )],
      },
      {
        id: 'contact',
        title: text('18. Contact', '18. Contact', '18. الاتصال'),
        paragraphs: [text(
          'Les questions contractuelles, demandes de support et notifications doivent être adressées à RODANBTECH au moyen des coordonnées officielles affichées dans les Mentions légales.',
          'Contract questions, support requests and notices must be sent to RODANBTECH using the official contact details in the Legal notice.',
          'يجب إرسال الأسئلة التعاقدية وطلبات الدعم والإشعارات إلى RODANBTECH عبر بيانات الاتصال الرسمية الواردة في الإشعار القانوني.',
        )],
      },
    ],
  },

  privacy: {
    title: text('Politique de confidentialité', 'Privacy policy', 'سياسة الخصوصية'),
    introduction: text(
      'Cette politique décrit les traitements liés au service Clikarage. Les bases légales et durées proposées restent soumises à validation juridique et à la configuration contractuelle de chaque garage.',
      'This policy describes processing connected with the Clikarage service. Proposed legal bases and retention periods remain subject to legal review and each garage’s contractual configuration.',
      'تصف هذه السياسة عمليات المعالجة المرتبطة بخدمة Clikarage. وتظل الأسس القانونية ومدد الاحتفاظ المقترحة خاضعة للمراجعة القانونية والإعداد التعاقدي لكل ورشة.',
    ),
    sections: [
      {
        id: 'scope',
        title: text('1. Périmètre', '1. Scope', '1. النطاق'),
        paragraphs: [text(
          'La politique couvre les espaces publics, les comptes, les espaces garage et automobiliste, les dossiers d’intervention, les devis, décisions, pièces jointes, rapports, rappels, notifications, journaux techniques et acceptations légales traités au moyen de Clikarage.',
          'This policy covers public pages, accounts, garage and motorist areas, service records, quotes, decisions, attachments, reports, reminders, notifications, technical logs and legal acceptances processed through Clikarage.',
          'تغطي هذه السياسة الصفحات العامة والحسابات ومساحتي الورشة وصاحب المركبة وملفات التدخل والعروض والقرارات والمرفقات والتقارير والتذكيرات والإشعارات والسجلات التقنية والموافقات القانونية المعالجة عبر Clikarage.',
        )],
      },
      {
        id: 'roles',
        title: text('2. Responsables de traitement et sous-traitant', '2. Controllers and processor', '2. مسؤولو المعالجة والمعالج'),
        paragraphs: [
          text(
            'RODANBTECH est responsable de traitement pour la gestion de ses prospects et clients professionnels, de ses comptes administratifs, de la sécurité du service, du support, de la facturation éventuelle, de la défense de ses droits et du respect de ses obligations propres.',
            'RODANBTECH is controller for its professional prospects and customers, administrative accounts, service security, support, any billing, defence of legal rights and compliance with its own obligations.',
            'تكون RODANBTECH مسؤولة عن معالجة بيانات عملائها المهنيين والمحتملين والحسابات الإدارية وأمن الخدمة والدعم وأي فوترة والدفاع عن حقوقها والوفاء بالتزاماتها الخاصة.',
          ),
          text(
            'Le garage est en principe responsable de traitement des données de ses clients, véhicules et dossiers. Lorsque RODANBTECH traite ces données pour fournir Clikarage selon les instructions du garage, RODANBTECH agit comme sous-traitant. Le partage exact des rôles doit être confirmé dans le contrat et le DPA.',
            'The garage is generally controller for its customer, vehicle and service-record data. When RODANBTECH processes that data to provide Clikarage under garage instructions, RODANBTECH acts as processor. The precise allocation of roles must be confirmed in the contract and DPA.',
            'تكون الورشة عادةً مسؤولة عن معالجة بيانات عملائها ومركباتهم وملفاتهم. وعندما تعالج RODANBTECH هذه البيانات لتقديم Clikarage وفق تعليمات الورشة فإنها تعمل كمعالج. ويجب تأكيد التوزيع الدقيق للأدوار في العقد واتفاق معالجة البيانات.',
          ),
        ],
      },
      {
        id: 'categories',
        title: text('3. Catégories de personnes et de données', '3. Categories of people and data', '3. فئات الأشخاص والبيانات'),
        paragraphs: [text(
          'Les personnes concernées peuvent être les contacts professionnels, utilisateurs du garage, automobilistes, représentants d’organisations, techniciens et destinataires de notifications. Les données peuvent comprendre identité et coordonnées, authentification et profil, organisation et établissement, rôles, véhicules et kilométrage, demandes et rendez-vous, chronologie atelier, diagnostics et messages du garage, recommandations, devis et décisions, pièces jointes privées, rapports de restitution, rappels, notifications, acceptations légales, préférences linguistiques et journaux de sécurité.',
          'Data subjects may include professional contacts, garage users, motorists, organisation representatives, technicians and notification recipients. Data may include identity and contact details, authentication and profile, organisation and centre, roles, vehicles and mileage, requests and appointments, workshop timeline, garage-authored diagnoses and messages, recommendations, quotes and decisions, private attachments, handover reports, reminders, notifications, legal acceptances, language preferences and security logs.',
          'قد تشمل فئات أصحاب البيانات جهات الاتصال المهنية ومستخدمي الورشة وأصحاب المركبات وممثلي المؤسسات والفنيين ومستلمي الإشعارات. وقد تشمل البيانات الهوية والاتصال والمصادقة والملف والمؤسسة والمركز والأدوار والمركبات والمسافة المقطوعة والطلبات والمواعيد والتسلسل الزمني للورشة والتشخيصات والرسائل التي تكتبها الورشة والتوصيات والعروض والقرارات والمرفقات الخاصة وتقارير التسليم والتذكيرات والإشعارات والموافقات القانونية وتفضيلات اللغة وسجلات الأمن.',
        )],
      },
      {
        id: 'purposes',
        title: text('4. Finalités', '4. Purposes', '4. الأغراض'),
        paragraphs: [text(
          'Les traitements servent notamment à créer et sécuriser les comptes, gérer les droits, fournir les espaces et fonctionnalités contractuels, organiser le parcours atelier, transmettre des documents et décisions, assurer le support, prévenir les abus, conserver des preuves, gérer les sauvegardes, produire des statistiques agrégées et respecter les obligations légales. Les rappels marketing ne doivent être utilisés que si le garage dispose d’une base légale appropriée.',
          'Processing purposes include creating and securing accounts, managing permissions, providing contracted areas and features, organising workshop journeys, transmitting documents and decisions, supporting users, preventing abuse, preserving evidence, managing backups, producing aggregate statistics and meeting legal obligations. Marketing reminders must only be used where the garage has an appropriate legal basis.',
          'تشمل أغراض المعالجة إنشاء الحسابات وتأمينها وإدارة الصلاحيات وتوفير المساحات والوظائف المتعاقد عليها وتنظيم مسار الورشة ونقل المستندات والقرارات وتقديم الدعم ومنع الإساءة وحفظ الأدلة وإدارة النسخ الاحتياطية وإنتاج إحصاءات مجمعة والوفاء بالالتزامات القانونية. ولا يجوز استخدام التذكيرات التسويقية إلا إذا كان لدى الورشة أساس قانوني مناسب.',
        )],
      },
      {
        id: 'legal-bases',
        title: text('5. Bases légales à confirmer', '5. Legal bases to be confirmed', '5. الأسس القانونية المطلوب تأكيدها'),
        paragraphs: [text(
          'Selon le traitement et le rôle de chaque partie, les bases envisagées sont l’exécution du contrat ou de mesures précontractuelles, le respect d’une obligation légale, l’intérêt légitime lié à la sécurité, au support et à la défense des droits, ou le consentement lorsqu’il est requis. Le garage détermine et documente la base applicable aux données de ses clients, aux rappels et aux communications qu’il initie.',
          'Depending on the processing and each party’s role, contemplated legal bases are contract or pre-contractual steps, legal obligation, legitimate interests in security, support and defence of rights, or consent where required. The garage determines and documents the basis for its customer data, reminders and communications.',
          'بحسب المعالجة ودور كل طرف، تشمل الأسس المقترحة تنفيذ العقد أو الإجراءات السابقة له والالتزام القانوني والمصلحة المشروعة في الأمن والدعم والدفاع عن الحقوق أو الموافقة عند اشتراطها. وتحدد الورشة وتوثق الأساس المطبق على بيانات عملائها وتذكيراتها واتصالاتها.',
        )],
      },
      {
        id: 'recipients',
        title: text('6. Destinataires et sous-traitants ultérieurs', '6. Recipients and sub-processors', '6. المستلمون والمعالجون اللاحقون'),
        paragraphs: [text(
          'Les données sont accessibles aux utilisateurs autorisés du garage, à l’automobiliste pour son propre dossier, à RODANBTECH dans la limite de ses missions et aux prestataires strictement nécessaires. Les prestataires principaux à confirmer contractuellement sont Supabase pour la base, l’authentification et le stockage, Vercel pour l’hébergement web, ainsi que les prestataires de domaine et de messagerie effectivement utilisés. Aucun fournisseur SMS ou DMS n’est annoncé comme connecté tant qu’il ne l’est pas.',
          'Data is accessible to authorised garage users, the motorist for their own record, RODANBTECH within its role and strictly necessary providers. Principal providers to be contractually confirmed are Supabase for database, authentication and storage, Vercel for web hosting, and the domain and email providers actually used. No SMS or DMS provider is represented as connected until it is actually connected.',
          'يمكن للمستخدمين المخولين في الورشة وصاحب المركبة في ملفه الخاص وRODANBTECH ضمن مهامها والمزودين الضروريين فقط الوصول إلى البيانات. ويجب تأكيد المزودين الرئيسيين تعاقديًا، وهم Supabase لقاعدة البيانات والمصادقة والتخزين وVercel لاستضافة الويب ومزودو النطاق والبريد المستخدمون فعليًا. ولا يُعرض أي مزود SMS أو DMS على أنه متصل قبل اتصاله فعليًا.',
        )],
      },
      {
        id: 'signed-urls',
        title: text('7. Pièces jointes et URLs signées', '7. Attachments and signed URLs', '7. المرفقات والروابط الموقعة'),
        paragraphs: [text(
          'Les pièces jointes métier sont stockées dans un espace privé et soumises à des règles d’accès par organisation, dossier et rôle. Une URL signée temporaire peut être générée pour permettre un téléchargement autorisé. Elle doit être protégée comme un lien confidentiel jusqu’à son expiration. Les métadonnées et journaux techniques peuvent conserver la trace d’une requête sans que l’application ne doive journaliser volontairement le lien complet.',
          'Business attachments are stored privately and controlled by organisation, record and role. A temporary signed URL may be generated for an authorised download and must be protected as a confidential link until expiry. Metadata and technical logs may record a request, but the application should not deliberately log the complete link.',
          'تُخزن المرفقات المهنية في مساحة خاصة وتخضع لقواعد وصول حسب المؤسسة والملف والدور. ويمكن إنشاء رابط موقع مؤقت لتنزيل مصرح به، ويجب حمايته كرابط سري حتى انتهاء صلاحيته. وقد تحتفظ البيانات الوصفية والسجلات التقنية بأثر الطلب، لكن لا ينبغي للتطبيق أن يسجل الرابط الكامل عمدًا.',
        )],
      },
      {
        id: 'retention',
        title: text('8. Durées de conservation proposées', '8. Proposed retention periods', '8. مدد الاحتفاظ المقترحة'),
        paragraphs: [text(
          'Les durées doivent être validées et configurées selon les obligations du garage. À titre de cadre proposé: comptes pendant la relation active puis délai de preuve adapté; dossiers, devis, décisions, rapports et pièces jointes selon les instructions du garage et ses obligations; acceptations légales jusqu’à cinq ans après la fin de la relation lorsqu’elles sont nécessaires comme preuve; journaux techniques jusqu’à 90 jours sauf incident; adresses de notification pendant la durée nécessaire à l’envoi et à la preuve; sauvegardes pendant leur cycle technique avant écrasement. Une donnée peut être conservée plus longtemps en cas d’obligation légale ou de litige documenté.',
          'Retention must be validated and configured according to garage obligations. As a proposed framework: accounts for the active relationship plus an appropriate evidence period; records, quotes, decisions, reports and attachments under garage instructions and duties; legal acceptances for up to five years after the relationship where required as evidence; technical logs for up to 90 days unless an incident occurs; notification addresses for the time needed to send and evidence messages; backups for their technical overwrite cycle. Data may be retained longer for a legal duty or documented dispute.',
          'يجب اعتماد مدد الاحتفاظ وإعدادها وفق التزامات الورشة. وكإطار مقترح: تُحفظ الحسابات طوال العلاقة النشطة ثم لمدة إثبات مناسبة؛ وتُحفظ الملفات والعروض والقرارات والتقارير والمرفقات وفق تعليمات الورشة والتزاماتها؛ ويمكن حفظ الموافقات القانونية حتى خمس سنوات بعد انتهاء العلاقة عند الحاجة للإثبات؛ وتُحفظ السجلات التقنية حتى 90 يومًا ما لم يقع حادث؛ وتُحفظ عناوين الإشعارات للمدة اللازمة للإرسال والإثبات؛ وتبقى النسخ الاحتياطية حتى دورة الاستبدال التقنية. ويمكن الاحتفاظ مدة أطول لالتزام قانوني أو نزاع موثق.',
        )],
      },
      {
        id: 'rights',
        title: text('9. Droits des personnes', '9. Individual rights', '9. حقوق الأشخاص'),
        paragraphs: [text(
          'Selon les conditions légales, une personne peut demander accès, rectification, effacement, limitation, opposition, portabilité ou retrait de son consentement. Pour un dossier géré par un garage, la demande est en principe adressée d’abord au garage responsable. RODANBTECH assiste le garage lorsque le DPA l’exige et répond directement pour ses traitements propres. Une réclamation peut être adressée à la CNIL.',
          'Subject to legal conditions, an individual may request access, correction, deletion, restriction, objection, portability or withdrawal of consent. For a garage-managed record, the request should generally first be sent to the responsible garage. RODANBTECH assists the garage where required by the DPA and responds directly for its own processing. Complaints may be made to the CNIL.',
          'وفق الشروط القانونية، يمكن للشخص طلب الوصول أو التصحيح أو الحذف أو التقييد أو الاعتراض أو قابلية النقل أو سحب الموافقة. وبالنسبة إلى ملف تديره ورشة، يوجه الطلب عادةً أولًا إلى الورشة المسؤولة. وتساعد RODANBTECH الورشة عندما يقتضي اتفاق معالجة البيانات ذلك، وتجيب مباشرةً عن معالجاتها الخاصة. ويمكن تقديم شكوى إلى CNIL.',
        )],
      },
      {
        id: 'security',
        title: text('10. Sécurité', '10. Security', '10. الأمن'),
        paragraphs: [text(
          'Les mesures comprennent notamment authentification, séparation des rôles, contrôles d’accès et RLS par périmètre, chiffrement des communications, stockage privé des pièces jointes, URLs temporaires, journalisation technique, sauvegardes, tests d’isolation et analyse de secrets. Aucune mesure ne supprime tout risque; les incidents sont traités selon leur nature et les obligations applicables.',
          'Measures include authentication, role separation, scoped access controls and RLS, encrypted communications, private attachment storage, temporary URLs, technical logging, backups, isolation testing and secret scanning. No measure eliminates every risk; incidents are handled according to their nature and applicable duties.',
          'تشمل التدابير المصادقة وفصل الأدوار وضوابط الوصول وRLS حسب النطاق وتشفير الاتصالات والتخزين الخاص للمرفقات والروابط المؤقتة والسجلات التقنية والنسخ الاحتياطية واختبارات العزل وفحص الأسرار. ولا يلغي أي تدبير كل المخاطر؛ وتعالج الحوادث بحسب طبيعتها والالتزامات المطبقة.',
        )],
      },
      {
        id: 'transfers',
        title: text('11. Localisation et transferts', '11. Location and transfers', '11. الموقع وعمليات النقل'),
        paragraphs: [text(
          'La base principale Supabase est configurée en région eu-west-3 (Paris). Des prestataires ou sous-traitants ultérieurs peuvent traiter certaines données depuis d’autres pays. Les mécanismes applicables, notamment décisions d’adéquation, clauses contractuelles types et mesures complémentaires, doivent être confirmés au regard des contrats fournisseurs à jour.',
          'The primary Supabase database is configured in eu-west-3 (Paris). Providers or further sub-processors may process certain data from other countries. Applicable mechanisms, including adequacy decisions, standard contractual clauses and supplementary measures, must be confirmed against current provider agreements.',
          'أُعدت قاعدة بيانات Supabase الرئيسية في منطقة eu-west-3 (باريس). وقد يعالج مزودون أو معالجون لاحقون بعض البيانات من دول أخرى. ويجب تأكيد الآليات المطبقة، بما فيها قرارات الملاءمة والبنود التعاقدية القياسية والتدابير الإضافية، وفق عقود المزودين السارية.',
        )],
      },
      {
        id: 'incidents',
        title: text('12. Incidents et demandes', '12. Incidents and requests', '12. الحوادث والطلبات'),
        paragraphs: [text(
          'RODANBTECH analyse les incidents dont elle a connaissance et informe le garage responsable sans retard indu lorsque l’incident concerne des données traitées pour son compte, afin qu’il puisse évaluer ses propres obligations. Les personnes peuvent utiliser l’adresse confidentialité officielle; aucune donnée sensible ne doit être envoyée inutilement par email.',
          'RODANBTECH investigates known incidents and informs the responsible garage without undue delay when an incident concerns data processed for it, so the garage can assess its duties. Individuals may use the official privacy address; sensitive data should not be unnecessarily sent by email.',
          'تحلل RODANBTECH الحوادث التي تعلم بها وتبلغ الورشة المسؤولة من دون تأخير غير مبرر عندما يتعلق الحادث ببيانات تعالج لحسابها، حتى تتمكن الورشة من تقييم التزاماتها. ويمكن للأشخاص استخدام عنوان الخصوصية الرسمي، ولا ينبغي إرسال بيانات حساسة بلا حاجة عبر البريد الإلكتروني.',
        )],
      },
      {
        id: 'cookies-updates',
        title: text('13. Traceurs, mises à jour et contact', '13. Trackers, updates and contact', '13. أدوات التتبع والتحديث والاتصال'),
        paragraphs: [text(
          'Le service utilise les mécanismes techniques nécessaires à la session, à la sécurité et aux préférences. Aucun traceur publicitaire ou marketing n’est déclaré actif dans la configuration actuelle. La politique sera mise à jour avant l’ajout d’un traitement nouveau significatif. Les demandes sont adressées au contact confidentialité figurant dans les Mentions légales.',
          'The service uses technical mechanisms required for sessions, security and preferences. No advertising or marketing tracker is declared active in the current configuration. This policy will be updated before a significant new processing activity is added. Requests should be sent to the privacy contact in the Legal notice.',
          'تستخدم الخدمة الآليات التقنية اللازمة للجلسات والأمن والتفضيلات. ولا يُعلن عن تفعيل أي أداة تتبع إعلانية أو تسويقية في الإعداد الحالي. وستُحدث هذه السياسة قبل إضافة معالجة جديدة مهمة. وتُرسل الطلبات إلى جهة اتصال الخصوصية الواردة في الإشعار القانوني.',
        )],
      },
    ],
  },

  dpa: {
    title: text('Accord de sous-traitance des données', 'Data processing agreement', 'اتفاق معالجة البيانات'),
    introduction: text(
      'Cet accord constitue une préparation contractuelle fondée sur l’article 28 du RGPD. Il doit être validé et complété avec le contrat commercial avant première contractualisation importante.',
      'This agreement is a contractual draft based on Article 28 GDPR. It must be legally reviewed and completed with the commercial agreement before the first significant commercial contract.',
      'هذا الاتفاق مسودة تعاقدية تستند إلى المادة 28 من اللائحة العامة لحماية البيانات. ويجب مراجعته قانونيًا واستكماله مع العقد التجاري قبل أول تعاقد تجاري مهم.',
    ),
    sections: [
      {
        id: 'roles',
        title: text('1. Objet et rôles', '1. Purpose and roles', '1. الغرض والأدوار'),
        paragraphs: [text(
          'Le présent accord encadre les traitements réalisés par RODANBTECH comme sous-traitant pour le compte du Client professionnel, responsable de traitement, dans le cadre de Clikarage. RODANBTECH reste responsable de traitement distinct pour la gestion de sa relation contractuelle, la sécurité de ses propres systèmes, le support administratif, la facturation éventuelle et ses obligations légales.',
          'This agreement governs processing by RODANBTECH as processor for the Professional Customer, acting as controller, in connection with Clikarage. RODANBTECH remains a separate controller for its contractual relationship, security of its own systems, administrative support, any billing and legal duties.',
          'ينظم هذا الاتفاق معالجة RODANBTECH بصفتها معالجًا لحساب العميل المهني المسؤول عن المعالجة في إطار Clikarage. وتظل RODANBTECH مسؤولة مستقلة عن معالجة علاقتها التعاقدية وأمن أنظمتها الخاصة والدعم الإداري وأي فوترة والتزاماتها القانونية.',
        )],
      },
      {
        id: 'duration',
        title: text('2. Durée et nature des traitements', '2. Duration and nature of processing', '2. مدة المعالجة وطبيعتها'),
        paragraphs: [text(
          'Le traitement dure pendant la fourniture du service, puis pendant les opérations convenues d’export, de restitution, de suppression et d’expiration des sauvegardes, sous réserve des obligations légales. Les opérations comprennent collecte, enregistrement, organisation, consultation, transmission contrôlée, hébergement, sauvegarde, correction, export et suppression.',
          'Processing lasts while the service is provided and during agreed export, return, deletion and backup-expiry operations, subject to legal duties. Operations include collection, recording, organisation, consultation, controlled transmission, hosting, backup, correction, export and deletion.',
          'تستمر المعالجة طوال تقديم الخدمة ثم خلال عمليات التصدير والإعادة والحذف وانتهاء النسخ الاحتياطية المتفق عليها، مع مراعاة الالتزامات القانونية. وتشمل العمليات الجمع والتسجيل والتنظيم والاطلاع والنقل المراقب والاستضافة والنسخ الاحتياطي والتصحيح والتصدير والحذف.',
        )],
      },
      {
        id: 'instructions',
        title: text('3. Instructions documentées', '3. Documented instructions', '3. التعليمات الموثقة'),
        paragraphs: [text(
          'RODANBTECH traite les données uniquement selon le contrat, les paramètres du service et les instructions documentées licites du Client professionnel. Si une instruction paraît contraire au droit ou à la sécurité, RODANBTECH en informe le Client professionnel et peut suspendre son exécution dans l’attente d’une clarification, sauf interdiction légale d’informer.',
          'RODANBTECH processes data only under the contract, service settings and lawful documented instructions of the Professional Customer. If an instruction appears unlawful or unsafe, RODANBTECH informs the Professional Customer and may suspend it pending clarification, unless legally prohibited from doing so.',
          'لا تعالج RODANBTECH البيانات إلا وفق العقد وإعدادات الخدمة والتعليمات المشروعة والموثقة للعميل المهني. وإذا بدت تعليمة مخالفة للقانون أو الأمن، تبلغ RODANBTECH العميل المهني ويمكنها تعليق تنفيذها حتى التوضيح، ما لم يمنع القانون الإبلاغ.',
        )],
      },
      {
        id: 'data-subjects',
        title: text('4. Personnes et catégories de données', '4. Data subjects and categories', '4. أصحاب البيانات وفئاتها'),
        paragraphs: [text(
          'Les personnes concernées peuvent inclure clients et prospects du garage, automobilistes, représentants, collaborateurs, techniciens et destinataires de notifications. Les données peuvent inclure identité, coordonnées, compte, rôle, organisation, établissement, véhicule, kilométrage, rendez-vous, dossier d’intervention, messages, diagnostic rédigé par le garage, recommandation, devis, décision, pièce jointe, rapport, rappel, notification, acceptation légale et journal technique.',
          'Data subjects may include garage customers and prospects, motorists, representatives, staff, technicians and notification recipients. Data may include identity, contact details, account, role, organisation, centre, vehicle, mileage, appointment, service record, messages, garage-authored diagnosis, recommendation, quote, decision, attachment, report, reminder, notification, legal acceptance and technical log.',
          'قد يشمل أصحاب البيانات عملاء الورشة والعملاء المحتملين وأصحاب المركبات والممثلين والعاملين والفنيين ومستلمي الإشعارات. وقد تشمل البيانات الهوية والاتصال والحساب والدور والمؤسسة والمركز والمركبة والمسافة المقطوعة والموعد وملف التدخل والرسائل والتشخيص الذي تكتبه الورشة والتوصية والعرض والقرار والمرفق والتقرير والتذكير والإشعار والموافقة القانونية والسجل التقني.',
        )],
      },
      {
        id: 'controller-duties',
        title: text('5. Obligations du Client professionnel', '5. Professional Customer obligations', '5. التزامات العميل المهني'),
        paragraphs: [text(
          'Le Client professionnel détermine les finalités et bases légales, informe les personnes, traite leurs demandes, configure les accès, limite les données au nécessaire, encadre les rappels et communications, et s’assure que les fichiers, photos et documents transmis sont licites. Il ne donne pas d’instruction destinée à contourner les protections ou les droits des personnes.',
          'The Professional Customer determines purposes and legal bases, informs individuals, handles their requests, configures access, limits data to what is necessary, governs reminders and communications, and ensures that submitted files, photos and documents are lawful. It does not instruct RODANBTECH to circumvent safeguards or individual rights.',
          'يحدد العميل المهني الأغراض والأسس القانونية ويبلغ الأشخاص ويعالج طلباتهم ويضبط الوصول ويقصر البيانات على اللازم وينظم التذكيرات والاتصالات ويضمن مشروعية الملفات والصور والمستندات المرسلة. ولا يصدر تعليمات تهدف إلى تجاوز الحماية أو حقوق الأشخاص.',
        )],
      },
      {
        id: 'confidentiality',
        title: text('6. Confidentialité', '6. Confidentiality', '6. السرية'),
        paragraphs: [text(
          'RODANBTECH veille à ce que les personnes autorisées à traiter les données soient soumises à une obligation de confidentialité et n’accèdent qu’aux informations nécessaires à leurs missions. Les accès de support sont limités, justifiés et retirés lorsqu’ils ne sont plus nécessaires.',
          'RODANBTECH ensures that authorised data handlers are bound by confidentiality and access only information needed for their duties. Support access is limited, justified and removed when no longer needed.',
          'تضمن RODANBTECH خضوع الأشخاص المخولين بالمعالجة لالتزام بالسرية وألا يصلوا إلا إلى المعلومات اللازمة لمهامهم. ويكون وصول الدعم محدودًا ومبررًا ويُلغى عند انتفاء الحاجة.',
        )],
      },
      {
        id: 'security',
        title: text('7. Mesures de sécurité', '7. Security measures', '7. تدابير الأمن'),
        paragraphs: [text(
          'Les mesures prévues incluent authentification, gestion des rôles, isolation organisation et établissement, RLS, contrôles serveur pour les opérations sensibles, communications chiffrées, stockage privé des pièces jointes, URLs signées temporaires, restrictions de fichiers, sauvegardes, journalisation, tests anti-fuite et gestion des secrets hors frontend. Les mesures évoluent selon les risques, sans constituer une garantie de sécurité absolue.',
          'Measures include authentication, role management, organisation and centre isolation, RLS, server-side controls for sensitive operations, encrypted communications, private attachment storage, temporary signed URLs, file restrictions, backups, logging, anti-leakage tests and keeping secrets out of the frontend. Measures evolve with risk and do not amount to an absolute security guarantee.',
          'تشمل التدابير المصادقة وإدارة الأدوار وعزل المؤسسة والمركز وRLS والضوابط الخادمية للعمليات الحساسة وتشفير الاتصالات والتخزين الخاص للمرفقات والروابط الموقعة المؤقتة وقيود الملفات والنسخ الاحتياطية والسجلات واختبارات منع التسرب وإبقاء الأسرار خارج الواجهة. وتتطور التدابير بحسب المخاطر ولا تمثل ضمانًا مطلقًا للأمن.',
        )],
      },
      {
        id: 'subprocessors',
        title: text('8. Sous-traitants ultérieurs et transferts', '8. Sub-processors and transfers', '8. المعالجون اللاحقون وعمليات النقل'),
        paragraphs: [text(
          'Le Client professionnel autorise les prestataires nécessaires identifiés dans la documentation contractuelle, sous réserve d’être informé des changements significatifs selon le mécanisme convenu. Supabase fournit notamment base de données, authentification et stockage; Vercel héberge l’interface web. Les listes de sous-traitants, entités contractantes, régions et garanties de transfert doivent être confirmées avant signature et tenues à jour.',
          'The Professional Customer authorises necessary providers identified in the contractual documentation, subject to notice of material changes under the agreed mechanism. Supabase provides database, authentication and storage; Vercel hosts the web interface. Sub-processor lists, contracting entities, regions and transfer safeguards must be confirmed before signature and kept current.',
          'يفوض العميل المهني المزودين الضروريين المحددين في الوثائق التعاقدية، مع إبلاغه بالتغييرات الجوهرية وفق الآلية المتفق عليها. وتوفر Supabase قاعدة البيانات والمصادقة والتخزين، وتستضيف Vercel واجهة الويب. ويجب تأكيد قوائم المعالجين اللاحقين والكيانات المتعاقدة والمناطق وضمانات النقل قبل التوقيع وتحديثها باستمرار.',
        )],
      },
      {
        id: 'assistance',
        title: text('9. Droits, analyses et autorités', '9. Rights, assessments and authorities', '9. الحقوق والتقييمات والسلطات'),
        paragraphs: [text(
          'Compte tenu de la nature du traitement, RODANBTECH assiste raisonnablement le Client professionnel pour les demandes d’exercice de droits, analyses d’impact, consultations d’autorité et obligations de sécurité. Le Client professionnel reste responsable des réponses et décisions relevant de son rôle. Les coûts ou délais exceptionnels peuvent être encadrés par l’offre.',
          'Taking account of the processing, RODANBTECH reasonably assists the Professional Customer with individual-rights requests, impact assessments, authority consultations and security duties. The Professional Customer remains responsible for responses and decisions within its role. Exceptional costs or timescales may be governed by the plan.',
          'مع مراعاة طبيعة المعالجة، تساعد RODANBTECH العميل المهني بصورة معقولة في طلبات الحقوق وتقييمات الأثر واستشارات السلطات والتزامات الأمن. ويظل العميل المهني مسؤولًا عن الردود والقرارات الداخلة في دوره. ويمكن تنظيم التكاليف أو المهل الاستثنائية في العرض.',
        )],
      },
      {
        id: 'incidents',
        title: text('10. Violations de données et incidents', '10. Data breaches and incidents', '10. خروقات البيانات والحوادث'),
        paragraphs: [text(
          'RODANBTECH notifie au Client professionnel, sans retard indu après en avoir pris connaissance, une violation de données concernant les traitements pour son compte. La notification fournit les informations disponibles utiles à l’évaluation et est complétée si nécessaire. Le Client professionnel décide des notifications aux personnes et autorités lorsqu’il en est responsable.',
          'RODANBTECH notifies the Professional Customer without undue delay after becoming aware of a personal-data breach affecting processing for it. The notice provides available information needed for assessment and is supplemented where necessary. The Professional Customer decides on notices to individuals and authorities where it is responsible.',
          'تبلغ RODANBTECH العميل المهني من دون تأخير غير مبرر بعد علمها بخرق بيانات يؤثر في المعالجة لحسابه. ويوفر الإبلاغ المعلومات المتاحة اللازمة للتقييم ويُستكمل عند الحاجة. ويقرر العميل المهني الإبلاغ للأشخاص والسلطات عندما يكون مسؤولًا عنه.',
        )],
      },
      {
        id: 'audit',
        title: text('11. Informations et audit', '11. Information and audit', '11. المعلومات والتدقيق'),
        paragraphs: [text(
          'RODANBTECH met à disposition les informations raisonnablement nécessaires pour démontrer le respect du présent accord. Un audit doit être proportionné, planifié, soumis à confidentialité, éviter de compromettre la sécurité ou les autres clients et privilégier d’abord les attestations, rapports et réponses documentaires disponibles.',
          'RODANBTECH provides information reasonably necessary to demonstrate compliance with this agreement. An audit must be proportionate, planned, confidential, avoid compromising security or other customers, and first use available attestations, reports and documentary responses.',
          'توفر RODANBTECH المعلومات اللازمة بصورة معقولة لإثبات احترام هذا الاتفاق. ويجب أن يكون التدقيق متناسبًا ومخططًا وسريًا وألا يضر بالأمن أو العملاء الآخرين، وأن يبدأ بالشهادات والتقارير والردود الوثائقية المتاحة.',
        )],
      },
      {
        id: 'deletion',
        title: text('12. Restitution, suppression et sauvegardes', '12. Return, deletion and backups', '12. الإعادة والحذف والنسخ الاحتياطية'),
        paragraphs: [text(
          'À la fin du service, RODANBTECH restitue les exports contractuellement prévus puis supprime ou anonymise les données selon les instructions licites du Client professionnel, sauf conservation légalement requise. Les copies de sauvegarde sont isolées de l’usage courant et supprimées par écrasement selon leur cycle documenté. Elles ne sont restaurées qu’en cas de reprise technique autorisée.',
          'At service end, RODANBTECH provides contracted exports and then deletes or anonymises data under lawful Professional Customer instructions, except where retention is legally required. Backup copies are isolated from normal use and deleted by overwrite under their documented cycle. They are restored only for authorised technical recovery.',
          'عند انتهاء الخدمة توفر RODANBTECH الصادرات المتعاقد عليها ثم تحذف البيانات أو تخفي هويتها وفق التعليمات المشروعة للعميل المهني، باستثناء ما يوجب القانون الاحتفاظ به. وتُعزل النسخ الاحتياطية عن الاستخدام العادي وتُحذف بالاستبدال وفق دورتها الموثقة، ولا تُستعاد إلا لاستعادة تقنية مصرح بها.',
        )],
      },
      {
        id: 'notifications',
        title: text('13. Notifications et rappels', '13. Notifications and reminders', '13. الإشعارات والتذكيرات'),
        paragraphs: [text(
          'Les adresses et numéros de destinataires ne peuvent être utilisés que pour les communications configurées et licites du Client professionnel. Les fournisseurs externes ne sont utilisés qu’après activation contractuelle et sécurisée. Le Client professionnel documente le consentement ou l’autre base légale des rappels; RODANBTECH limite la conservation de l’outbox et des erreurs à la durée nécessaire au suivi et à la preuve.',
          'Recipient addresses and numbers may be used only for the Professional Customer’s configured lawful communications. External providers are used only after contractual and secure activation. The Professional Customer documents consent or another legal basis for reminders; RODANBTECH limits outbox and error retention to what is needed for monitoring and evidence.',
          'لا يجوز استخدام عناوين وأرقام المستلمين إلا لاتصالات العميل المهني المشروعة والمعدة. ولا يُستخدم المزودون الخارجيون إلا بعد تفعيل تعاقدي وآمن. ويوثق العميل المهني الموافقة أو أي أساس قانوني آخر للتذكيرات؛ وتقصر RODANBTECH حفظ صندوق الإرسال والأخطاء على المدة اللازمة للمتابعة والإثبات.',
        )],
      },
      {
        id: 'priority-contact',
        title: text('14. Priorité contractuelle et contact', '14. Contract priority and contact', '14. أولوية العقد والاتصال'),
        paragraphs: [text(
          'Le présent accord complète le contrat de service. En cas de contradiction sur la protection des données traitées pour le compte du Client professionnel, le DPA signé ou les clauses négociées prévalent. Les notifications sont adressées aux contacts officiels désignés par chaque partie.',
          'This agreement supplements the service contract. If provisions conflict regarding personal data processed for the Professional Customer, the signed DPA or negotiated clauses prevail. Notices are sent to the official contacts designated by each party.',
          'يكمل هذا الاتفاق عقد الخدمة. وفي حال التعارض بشأن حماية البيانات المعالجة لحساب العميل المهني، يسود اتفاق معالجة البيانات الموقع أو البنود المتفاوض عليها. وتُرسل الإشعارات إلى جهات الاتصال الرسمية التي يعينها كل طرف.',
        )],
      },
    ],
  },
}

export interface LocalizedLegalSection {
  id: string
  title: string
  paragraphs: string[]
  items: string[]
}

export interface LocalizedCommercialLegalDocument {
  title: string
  introduction?: string
  sections: LocalizedLegalSection[]
}

export function getCommercialLegalDocument(
  document: CommercialLegalDocumentKey,
  lang: Lang,
): LocalizedCommercialLegalDocument {
  const source = commercialLegalContent[document]
  return {
    title: source.title[lang],
    introduction: source.introduction?.[lang],
    sections: source.sections.map((section) => ({
      id: section.id,
      title: section.title[lang],
      paragraphs: section.paragraphs.map((paragraph) => paragraph[lang]),
      items: section.items?.map((item) => item[lang]) ?? [],
    })),
  }
}

export function serializeCommercialLegalDocument(document: CommercialLegalDocumentKey, lang: Lang) {
  return JSON.stringify(getCommercialLegalDocument(document, lang))
}
