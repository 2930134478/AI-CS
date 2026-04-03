export type Lang = "zh-CN" | "en";

export type I18nKey =
  | "nav.features"
  | "nav.screenshots"
  | "nav.quickStart"
  | "nav.agentLogin"
  | "nav.menu"
  | "common.github"
  | "common.to"
  | "common.save"
  | "common.saving"
  | "common.restoreEnv"
  | "common.loading"
  | "common.search"
  | "common.prevPage"
  | "common.nextPage"
  | "common.copy"
  | "home.hero.tagline"
  | "home.hero.title"
  | "home.hero.subtitle"
  | "home.hero.cta.tryNow"
  | "home.hero.cta.agentLogin"
  | "home.hero.hint"
  | "home.stats.trustedBy"
  | "home.stats.clients"
  | "home.stats.conversations"
  | "home.stats.latency"
  | "home.stats.satisfaction"
  | "home.stats.val.clients"
  | "home.stats.val.conversations"
  | "home.stats.val.latency"
  | "home.stats.val.satisfaction"
  | "home.features.title"
  | "home.features.lead"
  | "home.cap.multimodel.title"
  | "home.cap.multimodel.desc"
  | "home.cap.kb.title"
  | "home.cap.kb.desc"
  | "home.cap.prompt.title"
  | "home.cap.prompt.desc"
  | "home.cap.human.title"
  | "home.cap.human.desc"
  | "home.cap.reports.title"
  | "home.cap.reports.desc"
  | "home.cap.logs.title"
  | "home.cap.logs.desc"
  | "home.screenshots.title"
  | "home.screenshots.lead"
  | "home.screenshots.prevAria"
  | "home.screenshots.nextAria"
  | "home.ss.dashboard.title"
  | "home.ss.dashboard.placeholder"
  | "home.ss.dashboard.alt"
  | "home.ss.visitor.title"
  | "home.ss.visitor.placeholder"
  | "home.ss.visitor.alt"
  | "home.ss.aiconfig.title"
  | "home.ss.aiconfig.placeholder"
  | "home.ss.aiconfig.alt"
  | "home.ss.users.title"
  | "home.ss.users.placeholder"
  | "home.ss.users.alt"
  | "home.ss.faq.title"
  | "home.ss.faq.placeholder"
  | "home.ss.faq.alt"
  | "home.ss.knowledge.title"
  | "home.ss.knowledge.placeholder"
  | "home.ss.knowledge.alt"
  | "home.ss.kbtest.title"
  | "home.ss.kbtest.placeholder"
  | "home.ss.kbtest.alt"
  | "home.ss.prompts.title"
  | "home.ss.prompts.placeholder"
  | "home.ss.prompts.alt"
  | "home.ss.logs.title"
  | "home.ss.logs.placeholder"
  | "home.ss.logs.alt"
  | "home.ss.analytics.title"
  | "home.ss.analytics.placeholder"
  | "home.ss.analytics.alt"
  | "home.quickStart.title"
  | "home.quickStart.lead"
  | "home.step1.title"
  | "home.step1.body"
  | "home.step2.title"
  | "home.step2.body"
  | "home.step3.title"
  | "home.step3.body"
  | "home.cta.title"
  | "home.cta.subtitle"
  | "home.cta.starRepo"
  | "home.cta.feedback"
  | "home.cta.mailSubject"
  | "home.cta.mailBody"
  | "footer.blurb"
  | "footer.column.product"
  | "footer.column.friendLinks"
  | "footer.column.contact"
  | "footer.noFriendLinks"
  | "footer.onlineChat"
  | "footer.openSourceLicense"
  | "footer.poweredBy"
  | "footer.allRightsReserved"
  | "footer.emailLabel"
  | "agent.page.dashboard"
  | "agent.page.internalChat"
  | "agent.page.knowledge"
  | "agent.page.faqs"
  | "agent.page.analytics"
  | "agent.page.logs"
  | "agent.page.users"
  | "agent.page.prompts"
  | "agent.page.settings"
  | "agent.profile"
  | "agent.logout"
  | "agent.chat.conversation"
  | "agent.chat.lastSeen"
  | "agent.chat.lastSeenUnknown"
  | "agent.chat.showAI"
  | "agent.chat.hideAI"
  | "agent.chat.closeConversation"
  | "agent.chat.refresh"
  | "agent.chat.soundOn"
  | "agent.chat.soundOff"
  | "agent.chat.toast.conversationClosed"
  | "agent.chat.toast.closeFailed"
  | "agent.chat.emptyPick"
  | "agent.layout.openNavMenu"
  | "agent.layout.openVisitorPanel"
  | "agent.internalChat.webSearchThisTurn"
  | "agent.internalChat.aiThinking"
  | "agent.internalChat.emptyHint"
  | "agent.internalChat.createFailed"
  | "agent.login.title"
  | "agent.login.subtitle"
  | "agent.login.username"
  | "agent.login.password"
  | "agent.login.submit"
  | "agent.login.submitting"
  | "agent.login.error.empty"
  | "agent.login.error.failed"
  | "agent.login.error.network"
  | "agent.login.demoHint"
  | "agent.logs.title"
  | "agent.logs.subtitle"
  | "agent.logs.policy.title"
  | "agent.logs.policy.desc"
  | "agent.logs.policy.current"
  | "agent.logs.policy.env"
  | "agent.logs.policy.overridden"
  | "agent.logs.level.all"
  | "agent.logs.category.all"
  | "agent.logs.source.all"
  | "agent.logs.event.placeholder"
  | "agent.logs.conversationId.placeholder"
  | "agent.logs.keyword.placeholder"
  | "agent.logs.table.time"
  | "agent.logs.table.level"
  | "agent.logs.table.category"
  | "agent.logs.table.event"
  | "agent.logs.table.conversation"
  | "agent.logs.table.source"
  | "agent.logs.table.message"
  | "agent.logs.paginationSummary"
  | "agent.logs.empty"
  | "agent.logs.detail.title"
  | "agent.logs.detail.time"
  | "agent.logs.detail.sourceEvent"
  | "agent.logs.detail.category"
  | "agent.logs.detail.traceId"
  | "agent.logs.detail.conversationId"
  | "agent.logs.detail.userVisitor"
  | "agent.logs.detail.message"
  | "agent.logs.detail.metaJson"
  | "agent.logs.detail.noMeta"
  | "agent.logs.toast.loadPolicyFailed"
  | "agent.logs.toast.loadLogsFailed"
  | "agent.logs.toast.savePolicyFailed"
  | "agent.logs.toast.restorePolicyFailed"
  | "agent.logs.toast.policySaved"
  | "agent.logs.toast.policyRestored"
  | "agent.logs.toast.messageCopied"
  | "agent.logs.toast.copyFailed"
  | "agent.conversationsPage.title"
  | "agent.conversationsPage.loading"
  | "agent.conversationsPage.empty"
  | "agent.conversationsPage.convLabel"
  | "agent.conversationsPage.visitorLabel"
  | "agent.conversationsPage.createdAt"
  | "agent.conversationsPage.updatedAt"
  | "agent.conversations.filter.all"
  | "agent.conversations.filter.mine"
  | "agent.conversations.filter.others"
  | "agent.conversations.status.open"
  | "agent.conversations.status.closed"
  | "agent.internalChat.title"
  | "agent.internalChat.new"
  | "agent.conversation.noMessage"
  | "agent.conversation.online"
  | "agent.conversation.visitor"
  | "agent.input.upload"
  | "agent.input.placeholder"
  | "agent.input.placeholder.withAttachment"
  | "agent.input.sending"
  | "agent.input.uploading"
  | "agent.input.send"
  | "agent.input.fileTooLarge"
  | "agent.input.fileTypeNotSupported"
  | "agent.input.uploadFailed"
  | "agent.aiSource.kb"
  | "agent.aiSource.llm"
  | "agent.aiSource.web"
  | "agent.common.back"
  | "agent.common.cancel"
  | "agent.common.create"
  | "agent.common.update"
  | "agent.common.delete"
  | "agent.common.edit"
  | "agent.common.keywordSearch"
  | "agent.common.noMatch"
  | "agent.common.none"
  | "agent.common.confirm"
  | "agent.faqs.title"
  | "agent.faqs.subtitle"
  | "agent.faqs.search.placeholder"
  | "agent.faqs.createButton"
  | "agent.faqs.empty"
  | "agent.faqs.empty.filtered"
  | "agent.faqs.dialog.createTitle"
  | "agent.faqs.dialog.editTitle"
  | "agent.faqs.dialog.deleteTitle"
  | "agent.faqs.form.question"
  | "agent.faqs.form.answer"
  | "agent.faqs.form.keywords"
  | "agent.faqs.form.keywordsHint"
  | "agent.faqs.toast.loadFailed"
  | "agent.faqs.toast.createFailed"
  | "agent.faqs.toast.updateFailed"
  | "agent.faqs.toast.deleteFailed"
  | "agent.faqs.toast.createSuccess"
  | "agent.faqs.toast.updateSuccess"
  | "agent.faqs.toast.deleteSuccess"
  | "agent.faqs.toast.emptyRequired"
  | "agent.faqs.card.keywords"
  | "agent.faqs.card.createdAt"
  | "agent.faqs.card.edit"
  | "agent.faqs.dialog.createTitle2"
  | "agent.faqs.dialog.createDesc"
  | "agent.faqs.dialog.editDesc"
  | "agent.faqs.dialog.deleteConfirm"
  | "agent.faqs.form.placeholder.question"
  | "agent.faqs.form.placeholder.answer"
  | "agent.faqs.form.placeholder.keywords"
  | "agent.faqs.form.keywordsOptional"
  | "agent.faqs.form.keywordsTip"
  | "agent.faqs.submit.creating"
  | "agent.faqs.submit.deleting"
  | "agent.perm.analytics"
  | "agent.perm.chat"
  | "agent.perm.faqs"
  | "agent.perm.kb_test"
  | "agent.perm.knowledge"
  | "agent.perm.logs"
  | "agent.perm.prompts"
  | "agent.perm.settings"
  | "agent.perm.users"
  | "agent.settings.aiCard.titleAdd"
  | "agent.settings.aiCard.titleEdit"
  | "agent.settings.aiForm.active"
  | "agent.settings.aiForm.apiKey"
  | "agent.settings.aiForm.apiUrl"
  | "agent.settings.aiForm.apiUrlPh"
  | "agent.settings.aiForm.descPh"
  | "agent.settings.aiForm.description"
  | "agent.settings.aiForm.model"
  | "agent.settings.aiForm.modelType"
  | "agent.settings.aiForm.modelPh"
  | "agent.settings.aiForm.provider"
  | "agent.settings.aiForm.providerPh"
  | "agent.settings.aiForm.public"
  | "agent.settings.aiForm.submitCreate"
  | "agent.settings.aiForm.submitUpdate"
  | "agent.settings.aiForm.submitting"
  | "agent.settings.backDashboard"
  | "agent.settings.badge.active"
  | "agent.settings.badge.public"
  | "agent.settings.confirmDeleteConfig"
  | "agent.settings.embedding.apiKey"
  | "agent.settings.embedding.apiKeyKeepEmpty"
  | "agent.settings.embedding.apiKeyInput"
  | "agent.settings.embedding.apiUrl"
  | "agent.settings.embedding.apiUrlPh"
  | "agent.settings.embedding.bgeLocal"
  | "agent.settings.embedding.customerKb"
  | "agent.settings.embedding.lead"
  | "agent.settings.embedding.model"
  | "agent.settings.embedding.modelPh"
  | "agent.settings.embedding.openaiCompatible"
  | "agent.settings.embedding.save"
  | "agent.settings.embedding.title"
  | "agent.settings.embedding.type"
  | "agent.settings.error.delete"
  | "agent.settings.error.loadConfigs"
  | "agent.settings.error.loadEmbedding"
  | "agent.settings.error.operation"
  | "agent.settings.global.noReceiveAi"
  | "agent.settings.global.noReceiveAiHint"
  | "agent.settings.list.apiUrlLabel"
  | "agent.settings.list.descLabel"
  | "agent.settings.list.empty"
  | "agent.settings.list.modelTypeLabel"
  | "agent.settings.list.title"
  | "agent.settings.modelType.audio"
  | "agent.settings.modelType.image"
  | "agent.settings.modelType.text"
  | "agent.settings.modelType.video"
  | "agent.settings.section.global"
  | "agent.settings.subtitle"
  | "agent.settings.title"
  | "agent.settings.toast.embeddingSaved"
  | "agent.settings.toast.profileUpdateFailed"
  | "agent.settings.webSearch.lead"
  | "agent.settings.webSearch.mode"
  | "agent.settings.webSearch.modeCustom"
  | "agent.settings.webSearch.modeHint"
  | "agent.settings.webSearch.modeVendor"
  | "agent.settings.webSearch.save"
  | "agent.settings.webSearch.title"
  | "agent.settings.webSearch.visitorToggle"
  | "agent.users.card.edit"
  | "agent.users.card.password"
  | "agent.users.createButton"
  | "agent.users.dialog.createTitle"
  | "agent.users.dialog.deleteConfirm"
  | "agent.users.dialog.deleteNote"
  | "agent.users.dialog.deleteTitle"
  | "agent.users.dialog.editTitle"
  | "agent.users.dialog.passwordTitle"
  | "agent.users.empty"
  | "agent.users.empty.filtered"
  | "agent.users.field.createdAt"
  | "agent.users.field.email"
  | "agent.users.field.username"
  | "agent.users.form.email"
  | "agent.users.form.newPassword"
  | "agent.users.form.oldPassword"
  | "agent.users.form.password"
  | "agent.users.form.permissions"
  | "agent.users.form.permissionsHint"
  | "agent.users.form.role"
  | "agent.users.form.username"
  | "agent.users.placeholder.email"
  | "agent.users.placeholder.emailOptional"
  | "agent.users.placeholder.nickname"
  | "agent.users.placeholder.nicknameOptional"
  | "agent.users.placeholder.oldPassword"
  | "agent.users.placeholder.password"
  | "agent.users.placeholder.username"
  | "agent.users.receiveAiLabel"
  | "agent.users.role.admin"
  | "agent.users.role.agent"
  | "agent.users.search.placeholder"
  | "agent.users.submit.creating"
  | "agent.users.submit.deleting"
  | "agent.users.submit.updating"
  | "agent.users.title"
  | "agent.users.toast.adminDeleteDisabled"
  | "agent.users.toast.adminPasswordDisabled"
  | "agent.users.toast.createFailed"
  | "agent.users.toast.createSuccess"
  | "agent.users.toast.deleteFailed"
  | "agent.users.toast.deleteSuccess"
  | "agent.users.toast.deleteTransferred"
  | "agent.users.toast.loadFailed"
  | "agent.users.toast.newPasswordRequired"
  | "agent.users.toast.oldPasswordRequired"
  | "agent.users.toast.passwordFailed"
  | "agent.users.toast.passwordSuccess"
  | "agent.users.toast.updateFailed"
  | "agent.users.toast.updateSuccess"
  | "agent.users.toast.usernamePasswordRequired"
  | "agent.users.tooltip.adminDeleteDbOnly"
  | "agent.users.tooltip.adminPasswordDbOnly"
  | "agent.users.tooltip.cannotDeleteSelf"
  | "agent.users.usernameImmutableHint"
  | "agent.users.form.nickname"
  | "agent.knowledge.title"
  | "agent.knowledge.rag"
  | "agent.knowledge.kb.create"
  | "agent.knowledge.kb.empty"
  | "agent.knowledge.kb.selectOne"
  | "agent.knowledge.kb.docCount"
  | "agent.knowledge.import.url"
  | "agent.knowledge.import.file"
  | "agent.knowledge.import.tabFile"
  | "agent.knowledge.import.tabUrl"
  | "agent.knowledge.import.pickFiles"
  | "agent.knowledge.import.filesSelected"
  | "agent.knowledge.import.action"
  | "agent.knowledge.import.urlListLabel"
  | "agent.knowledge.doc.create"
  | "agent.knowledge.doc.searchPh"
  | "agent.knowledge.doc.empty"
  | "agent.knowledge.doc.empty.filtered"
  | "agent.knowledge.doc.type"
  | "agent.knowledge.doc.createdAt"
  | "agent.knowledge.doc.publish"
  | "agent.knowledge.doc.unpublish"
  | "agent.knowledge.filter.all"
  | "agent.knowledge.pagination"
  | "agent.knowledge.status.draft"
  | "agent.knowledge.status.published"
  | "agent.knowledge.embedding.pending"
  | "agent.knowledge.embedding.processing"
  | "agent.knowledge.embedding.completed"
  | "agent.knowledge.embedding.failed"
  | "agent.knowledge.dialog.kbCreateTitle"
  | "agent.knowledge.dialog.kbCreateDesc"
  | "agent.knowledge.dialog.kbEditTitle"
  | "agent.knowledge.dialog.kbEditDesc"
  | "agent.knowledge.dialog.kbDeleteTitle"
  | "agent.knowledge.dialog.kbDeleteConfirm"
  | "agent.knowledge.dialog.kbDeleteHint"
  | "agent.knowledge.dialog.docCreateTitle"
  | "agent.knowledge.dialog.docCreateDesc"
  | "agent.knowledge.dialog.docEditTitle"
  | "agent.knowledge.dialog.docEditDesc"
  | "agent.knowledge.dialog.docDeleteTitle"
  | "agent.knowledge.dialog.docDeleteConfirm"
  | "agent.knowledge.dialog.importTitle"
  | "agent.knowledge.dialog.importDesc"
  | "agent.knowledge.field.name"
  | "agent.knowledge.field.descOptional"
  | "agent.knowledge.field.title"
  | "agent.knowledge.field.summaryOptional"
  | "agent.knowledge.field.content"
  | "agent.knowledge.ph.kbName"
  | "agent.knowledge.ph.kbDesc"
  | "agent.knowledge.ph.docTitle"
  | "agent.knowledge.ph.docSummary"
  | "agent.knowledge.ph.docContent"
  | "agent.knowledge.submitting.creating"
  | "agent.knowledge.submitting.updating"
  | "agent.knowledge.submitting.deleting"
  | "agent.knowledge.submitting.importing"
  | "agent.knowledge.toast.loadKbFailed"
  | "agent.knowledge.toast.loadDocFailed"
  | "agent.knowledge.toast.kbNameRequired"
  | "agent.knowledge.toast.selectKbFirst"
  | "agent.knowledge.toast.docTitleContentRequired"
  | "agent.knowledge.toast.createSuccess"
  | "agent.knowledge.toast.updateSuccess"
  | "agent.knowledge.toast.deleteSuccess"
  | "agent.knowledge.toast.updateFailed"
  | "agent.knowledge.toast.createKbFailed"
  | "agent.knowledge.toast.updateKbFailed"
  | "agent.knowledge.toast.deleteKbFailed"
  | "agent.knowledge.toast.createDocFailed"
  | "agent.knowledge.toast.updateDocFailed"
  | "agent.knowledge.toast.deleteDocFailed"
  | "agent.knowledge.toast.publishSuccess"
  | "agent.knowledge.toast.publishFailed"
  | "agent.knowledge.toast.unpublishSuccess"
  | "agent.knowledge.toast.unpublishFailed"
  | "agent.knowledge.toast.selectFiles"
  | "agent.knowledge.toast.urlRequired"
  | "agent.knowledge.toast.importDocFailed"
  | "agent.knowledge.toast.importUrlFailed"
  | "agent.knowledge.toast.importRefreshFailed"
  | "agent.knowledge.toast.importFailed.files"
  | "agent.knowledge.toast.importFailed.urls"
  | "agent.knowledge.toast.importDone.files"
  | "agent.knowledge.toast.importDone.urls"
  | "agent.knowledge.toast.importDone.partial"
  | "agent.prompts.title"
  | "agent.prompts.subtitle"
  | "agent.prompts.loadFailed"
  | "agent.prompts.saveSuccess"
  | "agent.prompts.saveFailed"
  | "agent.prompts.usageLabel"
  | "agent.prompts.ph.shortReply"
  | "agent.prompts.ph.withPlaceholders"
  | "agent.prompts.saving"
  | "agent.prompts.save"
  | "agent.prompts.hint.rag_prompt"
  | "agent.prompts.hint.rag_prompt_with_web_optional"
  | "agent.prompts.hint.no_kb_prompt"
  | "agent.prompts.hint.web_search_result_prompt"
  | "agent.prompts.hint.no_source_reply"
  | "agent.prompts.hint.ai_fail_reply"
  | "agent.prompts.hint.default"
  | "agent.prompts.usage.rag_prompt"
  | "agent.prompts.usage.rag_prompt_with_web_optional"
  | "agent.prompts.usage.no_kb_prompt"
  | "agent.prompts.usage.web_search_result_prompt"
  | "agent.prompts.usage.no_source_reply"
  | "agent.prompts.usage.ai_fail_reply"
  | "agent.analytics.title"
  | "agent.analytics.subtitle"
  | "agent.analytics.from"
  | "agent.analytics.to"
  | "agent.analytics.query"
  | "agent.analytics.loading"
  | "agent.analytics.empty"
  | "agent.analytics.emptyOrFailed"
  | "agent.analytics.stat.widgetOpens"
  | "agent.analytics.stat.widgetOpensSub"
  | "agent.analytics.stat.sessions"
  | "agent.analytics.stat.messages"
  | "agent.analytics.stat.aiReplies"
  | "agent.analytics.stat.aiFailed"
  | "agent.analytics.stat.aiFailureRate"
  | "agent.analytics.stat.aiFailureRateSub"
  | "agent.analytics.stat.kbHits"
  | "agent.analytics.stat.kbHitRate"
  | "agent.analytics.stat.kbHitRateSub"
  | "agent.analytics.stat.maxAiRounds"
  | "agent.analytics.stat.maxAiRoundsSub"
  | "agent.analytics.stat.sessionsWithAi"
  | "agent.analytics.stat.sessionsWithAiSub"
  | "agent.analytics.stat.aiToHuman"
  | "agent.analytics.stat.aiToHumanSub"
  | "agent.analytics.stat.humanToAi"
  | "agent.analytics.stat.humanToAiSub"
  | "agent.analytics.chart.widgetOpens"
  | "agent.analytics.chart.sessions"
  | "agent.analytics.chart.messages"
  | "agent.analytics.chart.aiReplies"
  | "common.irreversibleHint"
  | "chat.title"
  | "chat.mode.human"
  | "chat.mode.ai";

export const DEFAULT_LANG: Lang = "zh-CN";
export const LANG_STORAGE_KEY = "aics_lang";

export const DICT: Record<Lang, Record<I18nKey, string>> = {
  "zh-CN": {
    "nav.features": "核心能力",
    "nav.screenshots": "界面展示",
    "nav.quickStart": "快速接入",
    "nav.agentLogin": "客服登录",
    "nav.menu": "菜单",
    "common.github": "GitHub",
    "common.to": "到",
    "common.save": "保存到服务器",
    "common.saving": "保存中...",
    "common.restoreEnv": "恢复环境变量",
    "common.loading": "加载中...",
    "common.search": "查询",
    "common.prevPage": "上一页",
    "common.nextPage": "下一页",
    "common.copy": "复制",
    "home.hero.tagline": "AI 智能客服",
    "home.hero.title": "让客户服务更简单、更高效",
    "home.hero.subtitle":
      "7×24 小时智能应答，AI 与人工无缝切换，释放团队时间专注更有价值的事",
    "home.hero.cta.tryNow": "立即体验",
    "home.hero.cta.agentLogin": "客服登录",
    "home.hero.hint": "无需等待，可立即使用",
    "home.stats.trustedBy": "深受企业信赖",
    "home.stats.clients": "服务企业",
    "home.stats.conversations": "处理对话",
    "home.stats.latency": "响应时间",
    "home.stats.satisfaction": "满意度",
    "home.stats.val.clients": "1000+",
    "home.stats.val.conversations": "100万+",
    "home.stats.val.latency": "<100ms",
    "home.stats.val.satisfaction": "98%",
    "home.features.title": "核心能力",
    "home.features.lead": "从模型、知识库、提示词到人工协作、报表与日志，一套系统串起来。",
    "home.cap.multimodel.title": "多模型 AI 客服",
    "home.cap.multimodel.desc":
      "支持配置多家大模型与绘画等能力，访客与后台可统一管理模型与使用方式，便于替换供应商、控制成本。",
    "home.cap.kb.title": "知识库与 RAG",
    "home.cap.kb.desc":
      "文档入库、向量检索，让回答贴近你的业务资料；回复可标记是否使用知识库、模型或联网，便于核对与优化。",
    "home.cap.prompt.title": "提示词工程",
    "home.cap.prompt.desc":
      "配置系统中使用的提示词模板，用于不同领域 RAG、联网等不同的业务场景。",
    "home.cap.human.title": "人工客服与实时协作",
    "home.cap.human.desc":
      "在线状态、会话实时推送（WebSocket），支持人工接管与日常协作；访客小窗可嵌入任意站点。",
    "home.cap.reports.title": "可视化报表",
    "home.cap.reports.desc":
      "按日或自定义区间查看访客小窗打开、会话与消息、AI 回复与失败率、知识库命中率等指标，快速掌握运营态势。",
    "home.cap.logs.title": "日志中心",
    "home.cap.logs.desc":
      "结构化日志按分类与事件落库，支持 trace_id 与关键字筛选，关键链路与异常可追溯，便于排障与审计。",
    "home.screenshots.title": "界面展示",
    "home.screenshots.lead": "精心设计的界面，让管理更轻松",
    "home.screenshots.prevAria": "查看上一张",
    "home.screenshots.nextAria": "查看下一张",
    "home.ss.dashboard.title": "工作台",
    "home.ss.dashboard.placeholder": "工作台界面",
    "home.ss.dashboard.alt": "AI-CS 工作台界面",
    "home.ss.visitor.title": "访客端",
    "home.ss.visitor.placeholder": "访客端界面",
    "home.ss.visitor.alt": "AI-CS 访客端界面",
    "home.ss.aiconfig.title": "AI 配置",
    "home.ss.aiconfig.placeholder": "AI 配置界面",
    "home.ss.aiconfig.alt": "AI-CS AI 配置界面",
    "home.ss.users.title": "用户管理",
    "home.ss.users.placeholder": "用户管理界面",
    "home.ss.users.alt": "AI-CS 用户管理界面",
    "home.ss.faq.title": "FAQ 管理",
    "home.ss.faq.placeholder": "FAQ 管理界面",
    "home.ss.faq.alt": "AI-CS FAQ 管理界面",
    "home.ss.knowledge.title": "知识库管理",
    "home.ss.knowledge.placeholder": "知识库管理界面",
    "home.ss.knowledge.alt": "AI-CS 知识库管理界面",
    "home.ss.kbtest.title": "知识库测试",
    "home.ss.kbtest.placeholder": "知识库测试界面",
    "home.ss.kbtest.alt": "AI-CS 知识库测试界面",
    "home.ss.prompts.title": "提示词工程",
    "home.ss.prompts.placeholder": "提示词工程界面",
    "home.ss.prompts.alt": "AI-CS 提示词工程界面",
    "home.ss.logs.title": "日志中心",
    "home.ss.logs.placeholder": "日志中心界面",
    "home.ss.logs.alt": "AI-CS 日志中心界面",
    "home.ss.analytics.title": "可视化报表",
    "home.ss.analytics.placeholder": "可视化报表界面",
    "home.ss.analytics.alt": "AI-CS 可视化报表界面",
    "home.quickStart.title": "快速接入",
    "home.quickStart.lead": "三步跑通，从仓库到访客小窗。",
    "home.step1.title": "克隆与配置",
    "home.step1.body": "复制 .env 模板，填好数据库与管理员等必填项。",
    "home.step2.title": "一键启动",
    "home.step2.body": "使用 Docker Compose 拉起前后端与依赖服务（详见 README）。",
    "home.step3.title": "嵌入访客端",
    "home.step3.body": "在站点中挂载聊天小窗，后台完成模型与知识库配置后即可对外服务。",
    "home.cta.title": "准备好把 AI-CS 接到你的产品里了吗？",
    "home.cta.subtitle": "从开源仓库开始，或用在线 Demo 先看交互与能力边界。",
    "home.cta.starRepo": "Star / Fork 仓库",
    "home.cta.feedback": "建议反馈",
    "home.cta.mailSubject": "AI-CS 建议反馈",
    "home.cta.mailBody":
      "你好，我想反馈：\n\n1）问题/建议：\n2）影响范围/环境：\n3）期望结果：\n\n---\n联系方式（可选）：",
    "footer.blurb":
      "AI-CS 是一款 AI 驱动的智能客服系统，融合 AI 技术与人工客服，为企业提供高效、智能的客户服务解决方案。",
    "footer.column.product": "产品",
    "footer.column.friendLinks": "友情链接",
    "footer.column.contact": "联系我们",
    "footer.noFriendLinks": "暂无友情链接",
    "footer.onlineChat": "在线客服",
    "footer.openSourceLicense": "开源协议",
    "footer.poweredBy": "Powered by Next.js & Go |",
    "footer.allRightsReserved": "保留所有权利。",
    "footer.emailLabel": "邮箱",
    "agent.page.dashboard": "对话",
    "agent.page.internalChat": "知识库测试",
    "agent.page.knowledge": "知识库",
    "agent.page.faqs": "事件管理",
    "agent.page.analytics": "数据报表",
    "agent.page.logs": "日志中心",
    "agent.page.users": "用户管理",
    "agent.page.prompts": "提示词",
    "agent.page.settings": "AI 配置",
    "agent.profile": "个人资料",
    "agent.logout": "退出登录",
    "agent.chat.conversation": "对话",
    "agent.chat.lastSeen": "最后活跃",
    "agent.chat.lastSeenUnknown": "最后活跃 未知",
    "agent.chat.showAI": "显示 AI 消息",
    "agent.chat.hideAI": "隐藏 AI 消息",
    "agent.chat.closeConversation": "关闭会话",
    "agent.chat.refresh": "刷新",
    "agent.chat.soundOn": "关闭声音提示",
    "agent.chat.soundOff": "开启声音提示",
    "agent.chat.toast.conversationClosed": "已关闭会话",
    "agent.chat.toast.closeFailed": "关闭会话失败",
    "agent.chat.emptyPick": "选择一个对话开始聊天",
    "agent.layout.openNavMenu": "打开导航与对话列表",
    "agent.layout.openVisitorPanel": "打开访客详情",
    "agent.internalChat.webSearchThisTurn": "本回合联网搜索",
    "agent.internalChat.aiThinking": "AI 正在思考...",
    "agent.internalChat.emptyHint": "选择或新建内部对话，测试知识库效果",
    "agent.internalChat.createFailed": "创建内部对话失败",
    "agent.login.title": "客服登录",
    "agent.login.subtitle": "管理员和客服请在此登录",
    "agent.login.username": "用户名",
    "agent.login.password": "密码",
    "agent.login.submit": "登录",
    "agent.login.submitting": "登录中...",
    "agent.login.error.empty": "用户名和密码不能为空",
    "agent.login.error.failed": "登录失败",
    "agent.login.error.network": "登录失败，请检查网络连接",
    "agent.login.demoHint": "默认管理员账号：admin / admin123",
    "agent.logs.title": "日志中心",
    "agent.logs.subtitle": "按分类查看 AI / RAG / 系统 / 前端日志，用于排障定位。",
    "agent.logs.policy.title": "落库级别（性能）",
    "agent.logs.policy.desc":
      "仅将不低于所选级别的记录写入数据库。设为 warn 可大幅减少成功类 info 写入。也可在根目录 SYSTEM_LOG_MIN_LEVEL 配置默认值；此处保存后会写入数据库并覆盖环境变量，直至点击「恢复环境变量」。",
    "agent.logs.policy.current": "当前生效：",
    "agent.logs.policy.env": "环境变量默认：",
    "agent.logs.policy.overridden": "（已由控制台覆盖）",
    "agent.logs.level.all": "全部级别",
    "agent.logs.category.all": "全部分类",
    "agent.logs.source.all": "全部来源",
    "agent.logs.event.placeholder": "事件名(event)",
    "agent.logs.conversationId.placeholder": "会话ID",
    "agent.logs.keyword.placeholder": "关键词（message/meta）",
    "agent.logs.table.time": "时间",
    "agent.logs.table.level": "级别",
    "agent.logs.table.category": "分类",
    "agent.logs.table.event": "事件",
    "agent.logs.table.conversation": "会话",
    "agent.logs.table.source": "来源",
    "agent.logs.table.message": "消息",
    "agent.logs.paginationSummary": "共 {{total}} 条，当前第 {{page}}/{{pages}} 页",
    "agent.logs.empty": "暂无日志",
    "agent.logs.detail.title": "日志详情",
    "agent.logs.detail.time": "时间",
    "agent.logs.detail.sourceEvent": "source / event",
    "agent.logs.detail.category": "category",
    "agent.logs.detail.traceId": "trace_id",
    "agent.logs.detail.conversationId": "conversation_id",
    "agent.logs.detail.userVisitor": "user_id / visitor_id",
    "agent.logs.detail.message": "message",
    "agent.logs.detail.metaJson": "meta_json",
    "agent.logs.detail.noMeta": "（无 meta_json）",
    "agent.logs.toast.loadPolicyFailed": "加载落库策略失败",
    "agent.logs.toast.loadLogsFailed": "加载日志失败",
    "agent.logs.toast.savePolicyFailed": "保存失败",
    "agent.logs.toast.restorePolicyFailed": "恢复失败",
    "agent.logs.toast.policySaved": "已保存",
    "agent.logs.toast.policyRestored": "已恢复为环境变量默认",
    "agent.logs.toast.messageCopied": "已复制 message",
    "agent.logs.toast.copyFailed": "复制失败",
    "agent.conversationsPage.title": "对话列表",
    "agent.conversationsPage.loading": "加载中...",
    "agent.conversationsPage.empty": "暂无对话",
    "agent.conversationsPage.convLabel": "对话 #{{id}}",
    "agent.conversationsPage.visitorLabel": "访客ID: {{id}}",
    "agent.conversationsPage.createdAt": "创建时间: {{time}}",
    "agent.conversationsPage.updatedAt": "最后更新: {{time}}",
    "agent.conversations.filter.all": "全部对话",
    "agent.conversations.filter.mine": "我的对话",
    "agent.conversations.filter.others": "他人对话",
    "agent.conversations.status.open": "进行中",
    "agent.conversations.status.closed": "历史",
    "agent.internalChat.title": "知识库测试",
    "agent.internalChat.new": "新建",
    "agent.conversation.noMessage": "暂无消息",
    "agent.conversation.online": "在线",
    "agent.conversation.visitor": "访客",
    "agent.input.upload": "上传文件",
    "agent.input.placeholder": "输入消息...",
    "agent.input.placeholder.withAttachment": "添加消息（可选）...",
    "agent.input.sending": "发送中...",
    "agent.input.uploading": "上传中...",
    "agent.input.send": "发送",
    "agent.input.fileTooLarge": "文件大小超过限制（最大10MB）",
    "agent.input.fileTypeNotSupported": "不支持的文件类型",
    "agent.input.uploadFailed": "文件上传失败",
    "agent.aiSource.kb": "已使用知识库",
    "agent.aiSource.llm": "已使用大模型",
    "agent.aiSource.web": "已使用联网搜索",
    "agent.common.back": "返回",
    "agent.common.cancel": "取消",
    "agent.common.create": "创建",
    "agent.common.update": "更新",
    "agent.common.delete": "删除",
    "agent.common.edit": "编辑",
    "agent.common.keywordSearch": "关键词搜索",
    "agent.common.noMatch": "没有找到匹配的内容",
    "agent.common.none": "暂无",
    "agent.common.confirm": "确定",
    "agent.faqs.title": "事件管理（FAQ）",
    "agent.faqs.subtitle": "维护常见问题/事件模板，支持关键词搜索。",
    "agent.faqs.search.placeholder": "关键词搜索（用 % 分隔，例如：openai%api%调用）...",
    "agent.faqs.createButton": "创建事件",
    "agent.faqs.empty": "暂无事件",
    "agent.faqs.empty.filtered": "没有找到匹配的事件",
    "agent.faqs.dialog.createTitle": "创建事件",
    "agent.faqs.dialog.editTitle": "编辑事件",
    "agent.faqs.dialog.deleteTitle": "删除事件",
    "agent.faqs.form.question": "问题",
    "agent.faqs.form.answer": "答案",
    "agent.faqs.form.keywords": "关键词",
    "agent.faqs.form.keywordsHint": "多个关键词建议用 % 分隔，便于检索命中",
    "agent.faqs.toast.loadFailed": "加载 FAQ 列表失败",
    "agent.faqs.toast.createFailed": "创建 FAQ 失败",
    "agent.faqs.toast.updateFailed": "更新 FAQ 失败",
    "agent.faqs.toast.deleteFailed": "删除 FAQ 失败",
    "agent.faqs.toast.createSuccess": "创建成功",
    "agent.faqs.toast.updateSuccess": "更新成功",
    "agent.faqs.toast.deleteSuccess": "删除成功",
    "agent.faqs.toast.emptyRequired": "问题和答案不能为空",
    "agent.faqs.card.keywords": "关键词",
    "agent.faqs.card.createdAt": "创建时间",
    "agent.faqs.card.edit": "编辑",
    "agent.faqs.dialog.createTitle2": "创建新事件",
    "agent.faqs.dialog.createDesc": "填写问题和答案，可以添加关键词以便搜索",
    "agent.faqs.dialog.editDesc": "修改问题和答案，可以更新关键词以便搜索",
    "agent.faqs.dialog.deleteConfirm": "确定要删除事件 \"{{name}}\" 吗？",
    "agent.faqs.form.placeholder.question": "请输入问题",
    "agent.faqs.form.placeholder.answer": "请输入答案",
    "agent.faqs.form.placeholder.keywords":
      "例如：API、错误、配置（用逗号或空格分隔）",
    "agent.faqs.form.keywordsOptional": "关键词（可选）",
    "agent.faqs.form.keywordsTip":
      "提示：即使不填写关键词，系统也会自动搜索问题和答案中的内容。关键词字段用于添加额外的搜索索引，帮助用户更快找到相关内容。",
    "agent.faqs.submit.creating": "创建中...",
    "agent.faqs.submit.deleting": "删除中...",
    "agent.perm.analytics": "数据报表",
    "agent.perm.chat": "对话",
    "agent.perm.faqs": "事件管理",
    "agent.perm.kb_test": "知识库测试",
    "agent.perm.knowledge": "知识库",
    "agent.perm.logs": "日志中心",
    "agent.perm.prompts": "提示词",
    "agent.perm.settings": "AI 配置",
    "agent.perm.users": "用户管理",
    "agent.settings.aiCard.titleAdd": "添加 AI 配置",
    "agent.settings.aiCard.titleEdit": "编辑 AI 配置",
    "agent.settings.aiForm.active": "启用配置",
    "agent.settings.aiForm.apiKey": "API Key",
    "agent.settings.aiForm.apiUrl": "API 地址",
    "agent.settings.aiForm.apiUrlPh": "https://api.openai.com/v1/chat/completions",
    "agent.settings.aiForm.descPh": "例如：OpenAI GPT-3.5 Turbo 模型",
    "agent.settings.aiForm.description": "配置描述",
    "agent.settings.aiForm.model": "模型名称",
    "agent.settings.aiForm.modelType": "模型类型",
    "agent.settings.aiForm.modelPh": "例如：gpt-3.5-turbo、gpt-4",
    "agent.settings.aiForm.provider": "服务商名称",
    "agent.settings.aiForm.providerPh": "例如：OpenAI、Claude、自定义",
    "agent.settings.aiForm.public": "开放给访客使用",
    "agent.settings.aiForm.submitCreate": "创建配置",
    "agent.settings.aiForm.submitUpdate": "更新配置",
    "agent.settings.aiForm.submitting": "提交中...",
    "agent.settings.backDashboard": "返回工作台",
    "agent.settings.badge.active": "启用",
    "agent.settings.badge.public": "开放",
    "agent.settings.confirmDeleteConfig": "确定要删除这个配置吗？",
    "agent.settings.embedding.apiKey": "API Key",
    "agent.settings.embedding.apiKeyKeepEmpty": "留空则不更新",
    "agent.settings.embedding.apiKeyInput": "输入 API Key",
    "agent.settings.embedding.apiUrl": "API 地址",
    "agent.settings.embedding.apiUrlPh": "https://api.openai.com/v1 或兼容地址",
    "agent.settings.embedding.bgeLocal": "BGE 本地",
    "agent.settings.embedding.customerKb": "开放知识库给客服使用（允许创建知识库、上传文档、对话中引用）",
    "agent.settings.embedding.lead":
      "用于知识库文档向量化与 RAG 检索。仅管理员可修改；保存后立即生效，无需重启。",
    "agent.settings.embedding.model": "模型",
    "agent.settings.embedding.modelPh": "text-embedding-3-small",
    "agent.settings.embedding.openaiCompatible": "OpenAI / 兼容 API",
    "agent.settings.embedding.save": "保存配置",
    "agent.settings.embedding.title": "知识库向量模型",
    "agent.settings.embedding.type": "类型",
    "agent.settings.error.delete": "删除失败",
    "agent.settings.error.loadConfigs": "加载配置失败",
    "agent.settings.error.loadEmbedding": "加载失败",
    "agent.settings.error.operation": "操作失败",
    "agent.settings.global.noReceiveAi": "客服不接收 AI 对话",
    "agent.settings.global.noReceiveAiHint":
      "开启后，AI 对话将不会显示在对话列表中，也不会收到 AI 消息通知。但您仍可在会话页面手动开启「显示 AI 消息」查看 AI 对话历史。",
    "agent.settings.list.apiUrlLabel": "API 地址：",
    "agent.settings.list.descLabel": "描述：",
    "agent.settings.list.empty": "暂无配置，请添加",
    "agent.settings.list.modelTypeLabel": "模型类型：",
    "agent.settings.list.title": "已配置的 AI 服务",
    "agent.settings.modelType.audio": "语音",
    "agent.settings.modelType.image": "图片",
    "agent.settings.modelType.text": "文本",
    "agent.settings.modelType.video": "视频",
    "agent.settings.section.global": "全局设置",
    "agent.settings.subtitle": "管理 AI 服务商配置",
    "agent.settings.title": "AI 配置管理",
    "agent.settings.toast.embeddingSaved": "保存成功，配置已立即生效。",
    "agent.settings.toast.profileUpdateFailed": "更新设置失败，请重试",
    "agent.settings.webSearch.lead":
      "控制对话中的联网搜索方式与访客端是否显示联网选项。与「知识库向量模型」无关，仅影响 AI 对话时的联网行为。",
    "agent.settings.webSearch.mode": "联网方式",
    "agent.settings.webSearch.modeCustom": "自建 (Serper)",
    "agent.settings.webSearch.modeHint":
      "自建：由后端通过 Serper（MCP 或 HTTP）执行；厂商内置：使用当前对话所用 AI 厂商自带的联网搜索，不占用 Serper。",
    "agent.settings.webSearch.modeVendor": "厂商内置",
    "agent.settings.webSearch.save": "保存联网设置",
    "agent.settings.webSearch.title": "联网搜索设置",
    "agent.settings.webSearch.visitorToggle": "访客小窗显示「本回合联网搜索」选项",
    "agent.users.card.edit": "编辑",
    "agent.users.card.password": "密码",
    "agent.users.createButton": "创建用户",
    "agent.users.dialog.createTitle": "创建新用户",
    "agent.users.dialog.deleteConfirm": "确定要删除用户 {{username}} 吗？",
    "agent.users.dialog.deleteNote":
      "此操作不可恢复。若该用户有 AI 配置，系统会自动转移给当前管理员，避免配置丢失。",
    "agent.users.dialog.deleteTitle": "删除用户",
    "agent.users.dialog.editTitle": "编辑用户",
    "agent.users.dialog.passwordTitle": "修改密码",
    "agent.users.empty": "暂无用户",
    "agent.users.empty.filtered": "没有找到匹配的用户",
    "agent.users.field.createdAt": "创建时间",
    "agent.users.field.email": "邮箱",
    "agent.users.field.username": "用户名",
    "agent.users.form.email": "邮箱",
    "agent.users.form.newPassword": "新密码",
    "agent.users.form.oldPassword": "旧密码",
    "agent.users.form.password": "密码",
    "agent.users.form.permissions": "功能权限",
    "agent.users.form.permissionsHint":
      "默认仅开启「对话」。关闭后对应菜单不可见且后端接口会返回 403。",
    "agent.users.form.role": "角色",
    "agent.users.form.username": "用户名",
    "agent.users.form.nickname": "昵称",
    "agent.users.placeholder.email": "请输入邮箱",
    "agent.users.placeholder.emailOptional": "请输入邮箱（可选）",
    "agent.users.placeholder.nickname": "请输入昵称",
    "agent.users.placeholder.nicknameOptional": "请输入昵称（可选）",
    "agent.users.placeholder.oldPassword": "请输入旧密码",
    "agent.users.placeholder.password": "请输入密码",
    "agent.users.placeholder.username": "请输入用户名",
    "agent.users.receiveAiLabel": "接收 AI 对话",
    "agent.users.role.admin": "管理员",
    "agent.users.role.agent": "客服",
    "agent.users.search.placeholder": "搜索用户（用户名、昵称、邮箱）...",
    "agent.users.submit.creating": "创建中...",
    "agent.users.submit.deleting": "删除中...",
    "agent.users.submit.updating": "更新中...",
    "agent.users.title": "用户管理",
    "agent.users.toast.adminDeleteDisabled": "管理员账号仅支持数据库删除，前端已禁用",
    "agent.users.toast.adminPasswordDisabled": "管理员密码仅支持数据库修改，前端已禁用",
    "agent.users.toast.createFailed": "创建用户失败",
    "agent.users.toast.createSuccess": "创建成功",
    "agent.users.toast.deleteFailed": "删除用户失败",
    "agent.users.toast.deleteSuccess": "删除成功",
    "agent.users.toast.deleteTransferred": "删除成功，已自动转移 {{count}} 条 AI 配置到当前管理员",
    "agent.users.toast.loadFailed": "加载用户列表失败",
    "agent.users.toast.newPasswordRequired": "新密码不能为空",
    "agent.users.toast.oldPasswordRequired": "修改自己的密码需要提供旧密码",
    "agent.users.toast.passwordFailed": "更新密码失败",
    "agent.users.toast.passwordSuccess": "密码更新成功",
    "agent.users.toast.updateFailed": "更新用户失败",
    "agent.users.toast.updateSuccess": "更新成功",
    "agent.users.toast.usernamePasswordRequired": "用户名和密码不能为空",
    "agent.users.tooltip.adminDeleteDbOnly": "管理员账号仅支持数据库删除",
    "agent.users.tooltip.adminPasswordDbOnly": "管理员密码仅支持数据库修改",
    "agent.users.tooltip.cannotDeleteSelf": "不能删除当前登录用户",
    "agent.users.usernameImmutableHint": "用户名不能修改",
    "agent.knowledge.title": "知识库管理",
    "agent.knowledge.rag": "参与 RAG",
    "agent.knowledge.kb.create": "新建知识库",
    "agent.knowledge.kb.empty": "暂无知识库",
    "agent.knowledge.kb.selectOne": "请选择一个知识库",
    "agent.knowledge.kb.docCount": "{{count}} 篇文档",
    "agent.knowledge.import.url": "导入 URL",
    "agent.knowledge.import.file": "导入文件",
    "agent.knowledge.import.tabFile": "文件上传",
    "agent.knowledge.import.tabUrl": "URL 导入",
    "agent.knowledge.import.pickFiles": "选择文件",
    "agent.knowledge.import.filesSelected": "已选择 {{count}} 个文件",
    "agent.knowledge.import.action": "导入",
    "agent.knowledge.import.urlListLabel": "URL 列表（每行一个）",
    "agent.knowledge.doc.create": "新建文档",
    "agent.knowledge.doc.searchPh": "搜索文档...",
    "agent.knowledge.doc.empty": "暂无文档",
    "agent.knowledge.doc.empty.filtered": "没有找到匹配的文档",
    "agent.knowledge.doc.type": "类型",
    "agent.knowledge.doc.createdAt": "创建时间",
    "agent.knowledge.doc.publish": "发布",
    "agent.knowledge.doc.unpublish": "取消发布",
    "agent.knowledge.filter.all": "全部状态",
    "agent.knowledge.pagination": "第 {{page}} / {{totalPage}} 页，共 {{total}} 条",
    "agent.knowledge.status.draft": "草稿",
    "agent.knowledge.status.published": "已发布",
    "agent.knowledge.embedding.pending": "待处理",
    "agent.knowledge.embedding.processing": "处理中",
    "agent.knowledge.embedding.completed": "已完成",
    "agent.knowledge.embedding.failed": "失败",
    "agent.knowledge.dialog.kbCreateTitle": "创建知识库",
    "agent.knowledge.dialog.kbCreateDesc": "填写知识库名称和描述",
    "agent.knowledge.dialog.kbEditTitle": "编辑知识库",
    "agent.knowledge.dialog.kbEditDesc": "修改知识库名称和描述",
    "agent.knowledge.dialog.kbDeleteTitle": "删除知识库",
    "agent.knowledge.dialog.kbDeleteConfirm": "确定要删除知识库 \"{{name}}\" 吗？",
    "agent.knowledge.dialog.kbDeleteHint":
      "此操作将同时删除该知识库下的所有文档，此操作不可恢复，请谨慎操作。",
    "agent.knowledge.dialog.docCreateTitle": "创建文档",
    "agent.knowledge.dialog.docCreateDesc": "填写文档标题和内容",
    "agent.knowledge.dialog.docEditTitle": "编辑文档",
    "agent.knowledge.dialog.docEditDesc": "修改文档标题和内容",
    "agent.knowledge.dialog.docDeleteTitle": "删除文档",
    "agent.knowledge.dialog.docDeleteConfirm": "确定要删除文档 \"{{title}}\" 吗？",
    "agent.knowledge.dialog.importTitle": "导入文档",
    "agent.knowledge.dialog.importDesc":
      "选择文件上传或输入 URL 批量导入。当前支持的文件格式：Markdown（.md、.markdown）；PDF、Word 解析功能开发中。",
    "agent.knowledge.field.name": "名称",
    "agent.knowledge.field.descOptional": "描述（可选）",
    "agent.knowledge.field.title": "标题",
    "agent.knowledge.field.summaryOptional": "摘要（可选）",
    "agent.knowledge.field.content": "内容",
    "agent.knowledge.ph.kbName": "请输入知识库名称",
    "agent.knowledge.ph.kbDesc": "请输入知识库描述",
    "agent.knowledge.ph.docTitle": "请输入文档标题",
    "agent.knowledge.ph.docSummary": "请输入文档摘要",
    "agent.knowledge.ph.docContent": "请输入文档内容",
    "agent.knowledge.submitting.creating": "创建中...",
    "agent.knowledge.submitting.updating": "更新中...",
    "agent.knowledge.submitting.deleting": "删除中...",
    "agent.knowledge.submitting.importing": "导入中...",
    "agent.knowledge.toast.loadKbFailed": "加载知识库列表失败",
    "agent.knowledge.toast.loadDocFailed": "加载文档列表失败",
    "agent.knowledge.toast.kbNameRequired": "知识库名称不能为空",
    "agent.knowledge.toast.selectKbFirst": "请先选择知识库",
    "agent.knowledge.toast.docTitleContentRequired": "标题和内容不能为空",
    "agent.knowledge.toast.createSuccess": "创建成功",
    "agent.knowledge.toast.updateSuccess": "更新成功",
    "agent.knowledge.toast.deleteSuccess": "删除成功",
    "agent.knowledge.toast.updateFailed": "更新失败",
    "agent.knowledge.toast.createKbFailed": "创建知识库失败",
    "agent.knowledge.toast.updateKbFailed": "更新知识库失败",
    "agent.knowledge.toast.deleteKbFailed": "删除知识库失败",
    "agent.knowledge.toast.createDocFailed": "创建文档失败",
    "agent.knowledge.toast.updateDocFailed": "更新文档失败",
    "agent.knowledge.toast.deleteDocFailed": "删除文档失败",
    "agent.knowledge.toast.publishSuccess": "发布成功",
    "agent.knowledge.toast.publishFailed": "发布文档失败",
    "agent.knowledge.toast.unpublishSuccess": "取消发布成功",
    "agent.knowledge.toast.unpublishFailed": "取消发布文档失败",
    "agent.knowledge.toast.selectFiles": "请选择要导入的文件",
    "agent.knowledge.toast.urlRequired": "请输入至少一个 URL",
    "agent.knowledge.toast.importDocFailed": "导入文档失败",
    "agent.knowledge.toast.importUrlFailed": "导入 URL 失败",
    "agent.knowledge.toast.importRefreshFailed": "导入成功，但刷新列表失败，请手动刷新页面",
    "agent.knowledge.toast.importFailed.files": "导入失败：{{count}} 个文件未成功",
    "agent.knowledge.toast.importFailed.urls": "导入失败：{{count}} 个 URL 未成功",
    "agent.knowledge.toast.importDone.files": "导入完成：成功 {{success}} 个文件",
    "agent.knowledge.toast.importDone.urls": "导入完成：成功 {{success}} 个 URL",
    "agent.knowledge.toast.importDone.partial": "导入完成：成功 {{success}}，失败 {{failed}} {{err}}",
    "agent.prompts.title": "提示词",
    "agent.prompts.subtitle":
      "配置系统中使用的提示词模板，用于 RAG、联网等场景。仅管理员可修改。占位符说明见下方各卡片。",
    "agent.prompts.loadFailed": "加载提示词失败",
    "agent.prompts.saveSuccess": "保存成功，将立即生效。",
    "agent.prompts.saveFailed": "保存失败",
    "agent.prompts.usageLabel": "使用场景：",
    "agent.prompts.ph.shortReply": "请输入一句完整回复语",
    "agent.prompts.ph.withPlaceholders": "请输入提示词内容，保留占位符",
    "agent.prompts.saving": "保存中...",
    "agent.prompts.save": "保存",
    "agent.prompts.hint.rag_prompt":
      "占位符：{{rag_context}} 为知识库检索内容，{{user_message}} 为用户问题。",
    "agent.prompts.hint.rag_prompt_with_web_optional":
      "占位符：{{rag_context}} 为知识库检索内容，{{user_message}} 为用户问题。",
    "agent.prompts.hint.no_kb_prompt": "占位符：{{user_message}} 为用户问题。",
    "agent.prompts.hint.web_search_result_prompt":
      "占位符：{{web_context}} 为联网搜索结果，{{user_message}} 为用户问题。（当前流程未使用此模板）",
    "agent.prompts.hint.no_source_reply": "无占位符，内容将作为完整回复语直接展示给用户。",
    "agent.prompts.hint.ai_fail_reply": "无占位符，内容将作为完整回复语直接展示给用户。",
    "agent.prompts.hint.default": "请勿删除占位符，保存后由系统替换为实际内容。",
    "agent.prompts.usage.rag_prompt":
      "有知识库检索结果，且本回合未勾选「联网搜索」时，用此模板拼成 prompt 发给模型。",
    "agent.prompts.usage.rag_prompt_with_web_optional":
      "有知识库检索结果且本回合勾选「联网搜索」时，用此模板并传入联网工具，由模型决定是否调用联网。",
    "agent.prompts.usage.no_kb_prompt":
      "没有知识库检索结果且本回合未走联网时，用此模板让模型仅凭自身知识回答。",
    "agent.prompts.usage.web_search_result_prompt":
      "预留：若将来有「先联网搜再拼成一段 prompt」的流程，会使用此模板。当前未使用。",
    "agent.prompts.usage.no_source_reply":
      "既未命中知识库、也未使用大模型或联网时（如用户关闭了所有数据源），直接向用户展示这句话。",
    "agent.prompts.usage.ai_fail_reply": "调用 AI 接口失败（超时、报错等）时，向用户展示这句话。",
    "agent.analytics.title": "数据报表",
    "agent.analytics.subtitle":
      "访客小窗与 AI 客服统计（按上海时区自然日，不含「知识库测试」内部会话）",
    "agent.analytics.from": "从",
    "agent.analytics.to": "到",
    "agent.analytics.query": "查询",
    "agent.analytics.loading": "加载中…",
    "agent.analytics.empty": "暂无数据",
    "agent.analytics.emptyOrFailed": "暂无数据或加载失败",
    "agent.analytics.stat.widgetOpens": "小窗打开次数",
    "agent.analytics.stat.widgetOpensSub": "需前端埋点，历史数据可能为 0",
    "agent.analytics.stat.sessions": "新建会话数",
    "agent.analytics.stat.messages": "消息数",
    "agent.analytics.stat.aiReplies": "AI 回复次数",
    "agent.analytics.stat.aiFailed": "AI 失败次数",
    "agent.analytics.stat.aiFailureRate": "AI 失败率",
    "agent.analytics.stat.aiFailureRateSub": "占 AI 回复条数",
    "agent.analytics.stat.kbHits": "知识库命中次数",
    "agent.analytics.stat.kbHitRate": "知识库命中率",
    "agent.analytics.stat.kbHitRateSub": "占成功 AI 回复",
    "agent.analytics.stat.maxAiRounds": "最大 AI 对话轮数",
    "agent.analytics.stat.maxAiRoundsSub": "单会话内用户+AI 一轮",
    "agent.analytics.stat.sessionsWithAi": "AI 参与会话",
    "agent.analytics.stat.sessionsWithAiSub": "占新建会话 {{pct}}",
    "agent.analytics.stat.aiToHuman": "AI→人工（会话数）",
    "agent.analytics.stat.aiToHumanSub": "占有过 AI 发言的会话 {{pct}}",
    "agent.analytics.stat.humanToAi": "人工→AI（会话数）",
    "agent.analytics.stat.humanToAiSub": "占有过人工发言的会话 {{pct}}",
    "agent.analytics.chart.widgetOpens": "每日小窗打开",
    "agent.analytics.chart.sessions": "每日新建会话",
    "agent.analytics.chart.messages": "每日消息数",
    "agent.analytics.chart.aiReplies": "每日 AI 回复",
    "common.irreversibleHint": "此操作不可恢复，请谨慎操作。",
    "chat.title": "客服聊天",
    "chat.mode.human": "人工客服",
    "chat.mode.ai": "AI 客服",
  },
  en: {
    "nav.features": "Features",
    "nav.screenshots": "Screenshots",
    "nav.quickStart": "Quick Start",
    "nav.agentLogin": "Agent Login",
    "nav.menu": "Menu",
    "common.github": "GitHub",
    "common.to": "to",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.restoreEnv": "Use env default",
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.prevPage": "Prev",
    "common.nextPage": "Next",
    "common.copy": "Copy",
    "home.hero.tagline": "AI Customer Support",
    "home.hero.title": "Make customer support simpler and faster",
    "home.hero.subtitle":
      "24/7 AI responses with seamless handoff to human agents—free your team to focus on what matters.",
    "home.hero.cta.tryNow": "Try now",
    "home.hero.cta.agentLogin": "Agent Login",
    "home.hero.hint": "No waiting—ready to use",
    "home.stats.trustedBy": "Trusted by teams",
    "home.stats.clients": "Teams served",
    "home.stats.conversations": "Conversations handled",
    "home.stats.latency": "Response time",
    "home.stats.satisfaction": "Satisfaction",
    "home.stats.val.clients": "1000+",
    "home.stats.val.conversations": "1M+",
    "home.stats.val.latency": "<100ms",
    "home.stats.val.satisfaction": "98%",
    "home.features.title": "Capabilities",
    "home.features.lead":
      "From models and knowledge bases to prompts, human collaboration, analytics, and logs—one cohesive system.",
    "home.cap.multimodel.title": "Multi-model AI support",
    "home.cap.multimodel.desc":
      "Configure multiple LLM and multimodal providers; visitors and admins share one place to manage models and usage—easy to swap vendors and control cost.",
    "home.cap.kb.title": "Knowledge base & RAG",
    "home.cap.kb.desc":
      "Ingest documents and retrieve with vectors so answers stay on-brand; replies can show whether KB, model, or web search was used for review and tuning.",
    "home.cap.prompt.title": "Prompt engineering",
    "home.cap.prompt.desc":
      "Edit the prompt templates that power RAG, optional web search, and other flows across your scenarios.",
    "home.cap.human.title": "Human agents & real-time collaboration",
    "home.cap.human.desc":
      "Online presence, live sessions over WebSocket, seamless handoff and teamwork; embed the visitor widget on any site.",
    "home.cap.reports.title": "Analytics",
    "home.cap.reports.desc":
      "Daily or custom ranges for widget opens, sessions, messages, AI success/failure, KB hit rate, and more—see how operations are trending.",
    "home.cap.logs.title": "Structured logs",
    "home.cap.logs.desc":
      "Persisted by category and event with trace_id and keyword search—trace critical paths and incidents for troubleshooting and audit.",
    "home.screenshots.title": "Product screenshots",
    "home.screenshots.lead": "A polished UI that makes day-to-day admin work easier.",
    "home.screenshots.prevAria": "Previous screenshot",
    "home.screenshots.nextAria": "Next screenshot",
    "home.ss.dashboard.title": "Agent workspace",
    "home.ss.dashboard.placeholder": "Workspace preview",
    "home.ss.dashboard.alt": "AI-CS agent workspace",
    "home.ss.visitor.title": "Visitor widget",
    "home.ss.visitor.placeholder": "Visitor UI preview",
    "home.ss.visitor.alt": "AI-CS visitor experience",
    "home.ss.aiconfig.title": "AI configuration",
    "home.ss.aiconfig.placeholder": "AI settings preview",
    "home.ss.aiconfig.alt": "AI-CS AI configuration",
    "home.ss.users.title": "User management",
    "home.ss.users.placeholder": "User admin preview",
    "home.ss.users.alt": "AI-CS user management",
    "home.ss.faq.title": "FAQ management",
    "home.ss.faq.placeholder": "FAQ admin preview",
    "home.ss.faq.alt": "AI-CS FAQ management",
    "home.ss.knowledge.title": "Knowledge base",
    "home.ss.knowledge.placeholder": "Knowledge base preview",
    "home.ss.knowledge.alt": "AI-CS knowledge base",
    "home.ss.kbtest.title": "KB test chat",
    "home.ss.kbtest.placeholder": "KB test preview",
    "home.ss.kbtest.alt": "AI-CS knowledge base test",
    "home.ss.prompts.title": "Prompts",
    "home.ss.prompts.placeholder": "Prompts preview",
    "home.ss.prompts.alt": "AI-CS prompt management",
    "home.ss.logs.title": "Logs",
    "home.ss.logs.placeholder": "Logs preview",
    "home.ss.logs.alt": "AI-CS log center",
    "home.ss.analytics.title": "Analytics",
    "home.ss.analytics.placeholder": "Analytics preview",
    "home.ss.analytics.alt": "AI-CS analytics",
    "home.quickStart.title": "Quick start",
    "home.quickStart.lead": "Three steps from the repo to the visitor widget.",
    "home.step1.title": "Clone & configure",
    "home.step1.body": "Copy the .env template and fill required database and admin settings.",
    "home.step2.title": "Launch",
    "home.step2.body": "Bring up backend, frontend, and dependencies with Docker Compose (see README).",
    "home.step3.title": "Embed for visitors",
    "home.step3.body": "Mount the chat widget on your site; configure models and KB in the console, then go live.",
    "home.cta.title": "Ready to wire AI-CS into your product?",
    "home.cta.subtitle": "Start from the open-source repo, or explore the online demo first.",
    "home.cta.starRepo": "Star / Fork on GitHub",
    "home.cta.feedback": "Send feedback",
    "home.cta.mailSubject": "AI-CS feedback",
    "home.cta.mailBody":
      "Hi,\n\n1) Issue or suggestion:\n2) Scope / environment:\n3) Expected outcome:\n\n---\nContact (optional):",
    "footer.blurb":
      "AI-CS is an AI-powered customer support stack that blends automation and human agents for efficient, modern service.",
    "footer.column.product": "Product",
    "footer.column.friendLinks": "Friends",
    "footer.column.contact": "Contact",
    "footer.noFriendLinks": "No links yet",
    "footer.onlineChat": "Live chat",
    "footer.openSourceLicense": "Open-source license",
    "footer.poweredBy": "Powered by Next.js & Go |",
    "footer.allRightsReserved": "All rights reserved.",
    "footer.emailLabel": "Email",
    "agent.page.dashboard": "Chats",
    "agent.page.internalChat": "KB Test",
    "agent.page.knowledge": "Knowledge Base",
    "agent.page.faqs": "FAQs",
    "agent.page.analytics": "Analytics",
    "agent.page.logs": "Logs",
    "agent.page.users": "Users",
    "agent.page.prompts": "Prompts",
    "agent.page.settings": "AI Settings",
    "agent.profile": "Profile",
    "agent.logout": "Log out",
    "agent.chat.conversation": "Chat",
    "agent.chat.lastSeen": "Last seen",
    "agent.chat.lastSeenUnknown": "Last seen unknown",
    "agent.chat.showAI": "Show AI messages",
    "agent.chat.hideAI": "Hide AI messages",
    "agent.chat.closeConversation": "Close",
    "agent.chat.refresh": "Refresh",
    "agent.chat.soundOn": "Turn sound off",
    "agent.chat.soundOff": "Turn sound on",
    "agent.chat.toast.conversationClosed": "Conversation closed",
    "agent.chat.toast.closeFailed": "Failed to close conversation",
    "agent.chat.emptyPick": "Select a conversation to start",
    "agent.layout.openNavMenu": "Open navigation and conversation list",
    "agent.layout.openVisitorPanel": "Open visitor details",
    "agent.internalChat.webSearchThisTurn": "Web search this turn",
    "agent.internalChat.aiThinking": "AI is thinking...",
    "agent.internalChat.emptyHint": "Select or create an internal chat to test the knowledge base",
    "agent.internalChat.createFailed": "Failed to create internal chat",
    "agent.login.title": "Agent Login",
    "agent.login.subtitle": "Admins and agents sign in here",
    "agent.login.username": "Username",
    "agent.login.password": "Password",
    "agent.login.submit": "Sign in",
    "agent.login.submitting": "Signing in...",
    "agent.login.error.empty": "Username and password are required",
    "agent.login.error.failed": "Sign-in failed",
    "agent.login.error.network": "Sign-in failed. Check your connection.",
    "agent.login.demoHint": "Default admin: admin / admin123",
    "agent.logs.title": "Logs",
    "agent.logs.subtitle": "Filter AI / RAG / system / frontend logs for troubleshooting.",
    "agent.logs.policy.title": "Persist level (performance)",
    "agent.logs.policy.desc":
      "Only logs at or above this level are persisted. Set to warn to reduce successful info writes. You can set SYSTEM_LOG_MIN_LEVEL in .env as default; saving here persists to DB and overrides env until restored.",
    "agent.logs.policy.current": "Effective:",
    "agent.logs.policy.env": "Env default:",
    "agent.logs.policy.overridden": "(overridden in console)",
    "agent.logs.level.all": "All levels",
    "agent.logs.category.all": "All categories",
    "agent.logs.source.all": "All sources",
    "agent.logs.event.placeholder": "Event",
    "agent.logs.conversationId.placeholder": "Conversation ID",
    "agent.logs.keyword.placeholder": "Keyword (message/meta)",
    "agent.logs.table.time": "Time",
    "agent.logs.table.level": "Level",
    "agent.logs.table.category": "Category",
    "agent.logs.table.event": "Event",
    "agent.logs.table.conversation": "Conversation",
    "agent.logs.table.source": "Source",
    "agent.logs.table.message": "Message",
    "agent.logs.paginationSummary": "{{total}} rows · page {{page}} / {{pages}}",
    "agent.logs.empty": "No logs",
    "agent.logs.detail.title": "Log detail",
    "agent.logs.detail.time": "Time",
    "agent.logs.detail.sourceEvent": "source / event",
    "agent.logs.detail.category": "category",
    "agent.logs.detail.traceId": "trace_id",
    "agent.logs.detail.conversationId": "conversation_id",
    "agent.logs.detail.userVisitor": "user_id / visitor_id",
    "agent.logs.detail.message": "message",
    "agent.logs.detail.metaJson": "meta_json",
    "agent.logs.detail.noMeta": "(no meta_json)",
    "agent.logs.toast.loadPolicyFailed": "Failed to load persist policy",
    "agent.logs.toast.loadLogsFailed": "Failed to load logs",
    "agent.logs.toast.savePolicyFailed": "Save failed",
    "agent.logs.toast.restorePolicyFailed": "Restore failed",
    "agent.logs.toast.policySaved": "Saved",
    "agent.logs.toast.policyRestored": "Restored to env default",
    "agent.logs.toast.messageCopied": "Message copied",
    "agent.logs.toast.copyFailed": "Copy failed",
    "agent.conversationsPage.title": "Conversations",
    "agent.conversationsPage.loading": "Loading...",
    "agent.conversationsPage.empty": "No conversations",
    "agent.conversationsPage.convLabel": "Chat #{{id}}",
    "agent.conversationsPage.visitorLabel": "Visitor ID: {{id}}",
    "agent.conversationsPage.createdAt": "Created: {{time}}",
    "agent.conversationsPage.updatedAt": "Updated: {{time}}",
    "agent.conversations.filter.all": "All chats",
    "agent.conversations.filter.mine": "My chats",
    "agent.conversations.filter.others": "Others",
    "agent.conversations.status.open": "Open",
    "agent.conversations.status.closed": "History",
    "agent.internalChat.title": "KB Test",
    "agent.internalChat.new": "New",
    "agent.conversation.noMessage": "No messages yet",
    "agent.conversation.online": "Online",
    "agent.conversation.visitor": "Visitor",
    "agent.input.upload": "Upload",
    "agent.input.placeholder": "Type a message...",
    "agent.input.placeholder.withAttachment": "Add a message (optional)...",
    "agent.input.sending": "Sending...",
    "agent.input.uploading": "Uploading...",
    "agent.input.send": "Send",
    "agent.input.fileTooLarge": "File is too large (max 10MB)",
    "agent.input.fileTypeNotSupported": "Unsupported file type",
    "agent.input.uploadFailed": "Upload failed",
    "agent.aiSource.kb": "Knowledge base used",
    "agent.aiSource.llm": "LLM used",
    "agent.aiSource.web": "Web search used",
    "agent.common.back": "Back",
    "agent.common.cancel": "Cancel",
    "agent.common.create": "Create",
    "agent.common.update": "Update",
    "agent.common.delete": "Delete",
    "agent.common.edit": "Edit",
    "agent.common.keywordSearch": "Keyword search",
    "agent.common.noMatch": "No results found",
    "agent.common.none": "None",
    "agent.common.confirm": "Confirm",
    "agent.faqs.title": "FAQs",
    "agent.faqs.subtitle": "Manage FAQ/event templates with keyword search.",
    "agent.faqs.search.placeholder": "Keyword search (use % as separator)...",
    "agent.faqs.createButton": "Create",
    "agent.faqs.empty": "No FAQs",
    "agent.faqs.empty.filtered": "No matching FAQs",
    "agent.faqs.dialog.createTitle": "Create FAQ",
    "agent.faqs.dialog.editTitle": "Edit FAQ",
    "agent.faqs.dialog.deleteTitle": "Delete FAQ",
    "agent.faqs.form.question": "Question",
    "agent.faqs.form.answer": "Answer",
    "agent.faqs.form.keywords": "Keywords",
    "agent.faqs.form.keywordsHint": "Separate keywords with % for better matching",
    "agent.faqs.toast.loadFailed": "Failed to load FAQs",
    "agent.faqs.toast.createFailed": "Failed to create FAQ",
    "agent.faqs.toast.updateFailed": "Failed to update FAQ",
    "agent.faqs.toast.deleteFailed": "Failed to delete FAQ",
    "agent.faqs.toast.createSuccess": "Created",
    "agent.faqs.toast.updateSuccess": "Updated",
    "agent.faqs.toast.deleteSuccess": "Deleted",
    "agent.faqs.toast.emptyRequired": "Question and answer are required",
    "agent.faqs.card.keywords": "Keywords",
    "agent.faqs.card.createdAt": "Created",
    "agent.faqs.card.edit": "Edit",
    "agent.faqs.dialog.createTitle2": "Create FAQ",
    "agent.faqs.dialog.createDesc": "Provide question and answer. Add keywords for search.",
    "agent.faqs.dialog.editDesc": "Update question/answer and keywords for search.",
    "agent.faqs.dialog.deleteConfirm": "Delete \"{{name}}\"?",
    "agent.faqs.form.placeholder.question": "Enter question",
    "agent.faqs.form.placeholder.answer": "Enter answer",
    "agent.faqs.form.placeholder.keywords":
      "e.g. API, error, config (comma or space separated)",
    "agent.faqs.form.keywordsOptional": "Keywords (optional)",
    "agent.faqs.form.keywordsTip":
      "Tip: Even without keywords, the system searches question and answer content. Keywords add extra search index for faster matching.",
    "agent.faqs.submit.creating": "Creating...",
    "agent.faqs.submit.deleting": "Deleting...",
    "agent.perm.analytics": "Analytics",
    "agent.perm.chat": "Chat",
    "agent.perm.faqs": "FAQs",
    "agent.perm.kb_test": "KB test",
    "agent.perm.knowledge": "Knowledge base",
    "agent.perm.logs": "Logs",
    "agent.perm.prompts": "Prompts",
    "agent.perm.settings": "AI settings",
    "agent.perm.users": "Users",
    "agent.settings.aiCard.titleAdd": "Add AI config",
    "agent.settings.aiCard.titleEdit": "Edit AI config",
    "agent.settings.aiForm.active": "Enabled",
    "agent.settings.aiForm.apiKey": "API key",
    "agent.settings.aiForm.apiUrl": "API URL",
    "agent.settings.aiForm.apiUrlPh": "https://api.openai.com/v1/chat/completions",
    "agent.settings.aiForm.descPh": "e.g. OpenAI GPT-3.5 Turbo",
    "agent.settings.aiForm.description": "Description",
    "agent.settings.aiForm.model": "Model name",
    "agent.settings.aiForm.modelType": "Model type",
    "agent.settings.aiForm.modelPh": "e.g. gpt-3.5-turbo, gpt-4",
    "agent.settings.aiForm.provider": "Provider",
    "agent.settings.aiForm.providerPh": "e.g. OpenAI, Claude, Custom",
    "agent.settings.aiForm.public": "Available to visitors",
    "agent.settings.aiForm.submitCreate": "Create",
    "agent.settings.aiForm.submitUpdate": "Update",
    "agent.settings.aiForm.submitting": "Submitting...",
    "agent.settings.backDashboard": "Back to workspace",
    "agent.settings.badge.active": "On",
    "agent.settings.badge.public": "Public",
    "agent.settings.confirmDeleteConfig": "Delete this configuration?",
    "agent.settings.embedding.apiKey": "API key",
    "agent.settings.embedding.apiKeyKeepEmpty": "Leave blank to keep unchanged",
    "agent.settings.embedding.apiKeyInput": "Enter API key",
    "agent.settings.embedding.apiUrl": "API URL",
    "agent.settings.embedding.apiUrlPh": "https://api.openai.com/v1 or compatible URL",
    "agent.settings.embedding.bgeLocal": "BGE local",
    "agent.settings.embedding.customerKb":
      "Let agents use the knowledge base (create KBs, upload docs, cite in chat)",
    "agent.settings.embedding.lead":
      "Embeddings for KB documents and RAG. Admins only; changes apply immediately without restart.",
    "agent.settings.embedding.model": "Model",
    "agent.settings.embedding.modelPh": "text-embedding-3-small",
    "agent.settings.embedding.openaiCompatible": "OpenAI / compatible API",
    "agent.settings.embedding.save": "Save",
    "agent.settings.embedding.title": "Embedding model (knowledge base)",
    "agent.settings.embedding.type": "Type",
    "agent.settings.error.delete": "Delete failed",
    "agent.settings.error.loadConfigs": "Failed to load configs",
    "agent.settings.error.loadEmbedding": "Load failed",
    "agent.settings.error.operation": "Operation failed",
    "agent.settings.global.noReceiveAi": "Do not receive AI conversations",
    "agent.settings.global.noReceiveAiHint":
      "When enabled, AI conversations won't appear in your list or notify you. You can still open a chat and turn on “Show AI messages” to view history.",
    "agent.settings.list.apiUrlLabel": "API URL:",
    "agent.settings.list.descLabel": "Description:",
    "agent.settings.list.empty": "No configs yet — add one",
    "agent.settings.list.modelTypeLabel": "Model type:",
    "agent.settings.list.title": "Configured providers",
    "agent.settings.modelType.audio": "Audio",
    "agent.settings.modelType.image": "Image",
    "agent.settings.modelType.text": "Text",
    "agent.settings.modelType.video": "Video",
    "agent.settings.section.global": "Global",
    "agent.settings.subtitle": "Manage AI provider settings",
    "agent.settings.title": "AI configuration",
    "agent.settings.toast.embeddingSaved": "Saved. Changes are live.",
    "agent.settings.toast.profileUpdateFailed": "Failed to update settings. Try again.",
    "agent.settings.webSearch.lead":
      "Web search mode and whether visitors see the toggle. Unrelated to embedding settings above.",
    "agent.settings.webSearch.mode": "Web search mode",
    "agent.settings.webSearch.modeCustom": "Self-hosted (Serper)",
    "agent.settings.webSearch.modeHint":
      "Custom: backend uses Serper (MCP or HTTP). Vendor: use the model provider’s built-in web search (no Serper).",
    "agent.settings.webSearch.modeVendor": "Vendor built-in",
    "agent.settings.webSearch.save": "Save web search settings",
    "agent.settings.webSearch.title": "Web search",
    "agent.settings.webSearch.visitorToggle":
      "Show “web search this turn” in the visitor widget",
    "agent.users.card.edit": "Edit",
    "agent.users.card.password": "Password",
    "agent.users.createButton": "Create user",
    "agent.users.dialog.createTitle": "Create user",
    "agent.users.dialog.deleteConfirm": "Delete user {{username}}?",
    "agent.users.dialog.deleteNote":
      "This cannot be undone. If this user has AI configs, they are transferred to the current admin.",
    "agent.users.dialog.deleteTitle": "Delete user",
    "agent.users.dialog.editTitle": "Edit user",
    "agent.users.dialog.passwordTitle": "Change password",
    "agent.users.empty": "No users",
    "agent.users.empty.filtered": "No matching users",
    "agent.users.field.createdAt": "Created",
    "agent.users.field.email": "Email",
    "agent.users.field.username": "Username",
    "agent.users.form.email": "Email",
    "agent.users.form.newPassword": "New password",
    "agent.users.form.oldPassword": "Old password",
    "agent.users.form.password": "Password",
    "agent.users.form.permissions": "Permissions",
    "agent.users.form.permissionsHint":
      "Only “Chat” is on by default. Turning off hides the menu and returns 403 from APIs.",
    "agent.users.form.role": "Role",
    "agent.users.form.username": "Username",
    "agent.users.form.nickname": "Nickname",
    "agent.users.placeholder.email": "Email",
    "agent.users.placeholder.emailOptional": "Email (optional)",
    "agent.users.placeholder.nickname": "Nickname",
    "agent.users.placeholder.nicknameOptional": "Nickname (optional)",
    "agent.users.placeholder.oldPassword": "Current password",
    "agent.users.placeholder.password": "Password",
    "agent.users.placeholder.username": "Username",
    "agent.users.receiveAiLabel": "Receive AI conversations",
    "agent.users.role.admin": "Admin",
    "agent.users.role.agent": "Agent",
    "agent.users.search.placeholder": "Search by username, nickname, email…",
    "agent.users.submit.creating": "Creating...",
    "agent.users.submit.deleting": "Deleting...",
    "agent.users.submit.updating": "Updating...",
    "agent.users.title": "Users",
    "agent.users.toast.adminDeleteDisabled":
      "Admin accounts can only be removed via database; disabled in UI",
    "agent.users.toast.adminPasswordDisabled":
      "Admin passwords can only be changed via database; disabled in UI",
    "agent.users.toast.createFailed": "Failed to create user",
    "agent.users.toast.createSuccess": "Created",
    "agent.users.toast.deleteFailed": "Failed to delete user",
    "agent.users.toast.deleteSuccess": "Deleted",
    "agent.users.toast.deleteTransferred":
      "Deleted. {{count}} AI config(s) moved to the current admin",
    "agent.users.toast.loadFailed": "Failed to load users",
    "agent.users.toast.newPasswordRequired": "New password is required",
    "agent.users.toast.oldPasswordRequired": "Current password is required to change your own password",
    "agent.users.toast.passwordFailed": "Failed to update password",
    "agent.users.toast.passwordSuccess": "Password updated",
    "agent.users.toast.updateFailed": "Failed to update user",
    "agent.users.toast.updateSuccess": "Updated",
    "agent.users.toast.usernamePasswordRequired": "Username and password are required",
    "agent.users.tooltip.adminDeleteDbOnly": "Admin deletion is database-only",
    "agent.users.tooltip.adminPasswordDbOnly": "Admin password is database-only",
    "agent.users.tooltip.cannotDeleteSelf": "You cannot delete the signed-in user",
    "agent.users.usernameImmutableHint": "Username cannot be changed",
    "agent.knowledge.title": "Knowledge base",
    "agent.knowledge.rag": "RAG",
    "agent.knowledge.kb.create": "New knowledge base",
    "agent.knowledge.kb.empty": "No knowledge bases",
    "agent.knowledge.kb.selectOne": "Select a knowledge base",
    "agent.knowledge.kb.docCount": "{{count}} docs",
    "agent.knowledge.import.url": "Import URL",
    "agent.knowledge.import.file": "Import files",
    "agent.knowledge.import.tabFile": "Files",
    "agent.knowledge.import.tabUrl": "URLs",
    "agent.knowledge.import.pickFiles": "Choose files",
    "agent.knowledge.import.filesSelected": "{{count}} file(s) selected",
    "agent.knowledge.import.action": "Import",
    "agent.knowledge.import.urlListLabel": "URL list (one per line)",
    "agent.knowledge.doc.create": "New doc",
    "agent.knowledge.doc.searchPh": "Search docs...",
    "agent.knowledge.doc.empty": "No docs",
    "agent.knowledge.doc.empty.filtered": "No matching docs",
    "agent.knowledge.doc.type": "Type",
    "agent.knowledge.doc.createdAt": "Created",
    "agent.knowledge.doc.publish": "Publish",
    "agent.knowledge.doc.unpublish": "Unpublish",
    "agent.knowledge.filter.all": "All statuses",
    "agent.knowledge.pagination": "Page {{page}} / {{totalPage}}, total {{total}}",
    "agent.knowledge.status.draft": "Draft",
    "agent.knowledge.status.published": "Published",
    "agent.knowledge.embedding.pending": "Pending",
    "agent.knowledge.embedding.processing": "Processing",
    "agent.knowledge.embedding.completed": "Completed",
    "agent.knowledge.embedding.failed": "Failed",
    "agent.knowledge.dialog.kbCreateTitle": "Create knowledge base",
    "agent.knowledge.dialog.kbCreateDesc": "Enter name and description",
    "agent.knowledge.dialog.kbEditTitle": "Edit knowledge base",
    "agent.knowledge.dialog.kbEditDesc": "Update name and description",
    "agent.knowledge.dialog.kbDeleteTitle": "Delete knowledge base",
    "agent.knowledge.dialog.kbDeleteConfirm": "Delete knowledge base \"{{name}}\"?",
    "agent.knowledge.dialog.kbDeleteHint":
      "This will also delete all docs in the knowledge base. This action cannot be undone.",
    "agent.knowledge.dialog.docCreateTitle": "Create doc",
    "agent.knowledge.dialog.docCreateDesc": "Enter title and content",
    "agent.knowledge.dialog.docEditTitle": "Edit doc",
    "agent.knowledge.dialog.docEditDesc": "Update title and content",
    "agent.knowledge.dialog.docDeleteTitle": "Delete doc",
    "agent.knowledge.dialog.docDeleteConfirm": "Delete doc \"{{title}}\"?",
    "agent.knowledge.dialog.importTitle": "Import docs",
    "agent.knowledge.dialog.importDesc":
      "Upload files or import by URL. Supported: Markdown (.md, .markdown). PDF/Word parsing is in progress.",
    "agent.knowledge.field.name": "Name",
    "agent.knowledge.field.descOptional": "Description (optional)",
    "agent.knowledge.field.title": "Title",
    "agent.knowledge.field.summaryOptional": "Summary (optional)",
    "agent.knowledge.field.content": "Content",
    "agent.knowledge.ph.kbName": "Knowledge base name",
    "agent.knowledge.ph.kbDesc": "Knowledge base description",
    "agent.knowledge.ph.docTitle": "Doc title",
    "agent.knowledge.ph.docSummary": "Doc summary",
    "agent.knowledge.ph.docContent": "Doc content",
    "agent.knowledge.submitting.creating": "Creating...",
    "agent.knowledge.submitting.updating": "Updating...",
    "agent.knowledge.submitting.deleting": "Deleting...",
    "agent.knowledge.submitting.importing": "Importing...",
    "agent.knowledge.toast.loadKbFailed": "Failed to load knowledge bases",
    "agent.knowledge.toast.loadDocFailed": "Failed to load docs",
    "agent.knowledge.toast.kbNameRequired": "Knowledge base name is required",
    "agent.knowledge.toast.selectKbFirst": "Please select a knowledge base first",
    "agent.knowledge.toast.docTitleContentRequired": "Title and content are required",
    "agent.knowledge.toast.createSuccess": "Created",
    "agent.knowledge.toast.updateSuccess": "Updated",
    "agent.knowledge.toast.deleteSuccess": "Deleted",
    "agent.knowledge.toast.updateFailed": "Update failed",
    "agent.knowledge.toast.createKbFailed": "Failed to create knowledge base",
    "agent.knowledge.toast.updateKbFailed": "Failed to update knowledge base",
    "agent.knowledge.toast.deleteKbFailed": "Failed to delete knowledge base",
    "agent.knowledge.toast.createDocFailed": "Failed to create doc",
    "agent.knowledge.toast.updateDocFailed": "Failed to update doc",
    "agent.knowledge.toast.deleteDocFailed": "Failed to delete doc",
    "agent.knowledge.toast.publishSuccess": "Published",
    "agent.knowledge.toast.publishFailed": "Failed to publish doc",
    "agent.knowledge.toast.unpublishSuccess": "Unpublished",
    "agent.knowledge.toast.unpublishFailed": "Failed to unpublish doc",
    "agent.knowledge.toast.selectFiles": "Please choose files to import",
    "agent.knowledge.toast.urlRequired": "Please enter at least one URL",
    "agent.knowledge.toast.importDocFailed": "Failed to import docs",
    "agent.knowledge.toast.importUrlFailed": "Failed to import URLs",
    "agent.knowledge.toast.importRefreshFailed":
      "Imported, but failed to refresh list. Please refresh the page.",
    "agent.knowledge.toast.importFailed.files": "Import failed: {{count}} file(s)",
    "agent.knowledge.toast.importFailed.urls": "Import failed: {{count}} URL(s)",
    "agent.knowledge.toast.importDone.files": "Imported: {{success}} file(s)",
    "agent.knowledge.toast.importDone.urls": "Imported: {{success}} URL(s)",
    "agent.knowledge.toast.importDone.partial":
      "Imported: {{success}} success, {{failed}} failed {{err}}",
    "agent.prompts.title": "Prompts",
    "agent.prompts.subtitle":
      "Edit system prompt templates for RAG and web search. Admin only. Placeholder hints are shown per card.",
    "agent.prompts.loadFailed": "Failed to load prompts",
    "agent.prompts.saveSuccess": "Saved. Changes apply immediately.",
    "agent.prompts.saveFailed": "Save failed",
    "agent.prompts.usageLabel": "When used:",
    "agent.prompts.ph.shortReply": "Enter a full short reply sentence",
    "agent.prompts.ph.withPlaceholders": "Enter prompt text; keep placeholders",
    "agent.prompts.saving": "Saving...",
    "agent.prompts.save": "Save",
    "agent.prompts.hint.rag_prompt":
      "Placeholders: {{rag_context}} = retrieved KB text, {{user_message}} = user question.",
    "agent.prompts.hint.rag_prompt_with_web_optional":
      "Placeholders: {{rag_context}} = retrieved KB text, {{user_message}} = user question.",
    "agent.prompts.hint.no_kb_prompt": "Placeholder: {{user_message}} = user question.",
    "agent.prompts.hint.web_search_result_prompt":
      "Placeholders: {{web_context}} = web results, {{user_message}} = user question. (Not used in current flow)",
    "agent.prompts.hint.no_source_reply": "No placeholders; shown to the user as a full reply.",
    "agent.prompts.hint.ai_fail_reply": "No placeholders; shown to the user as a full reply.",
    "agent.prompts.hint.default": "Do not remove placeholders; they are filled in by the system.",
    "agent.prompts.usage.rag_prompt":
      "When KB retrieval succeeded and web search is off for this turn, this template is sent to the model.",
    "agent.prompts.usage.rag_prompt_with_web_optional":
      "When KB retrieval succeeded and web search is on, this template enables the model to optionally use web tools.",
    "agent.prompts.usage.no_kb_prompt":
      "When there is no KB hit and no web flow, the model answers from its own knowledge only.",
    "agent.prompts.usage.web_search_result_prompt":
      "Reserved for a future “web first, then prompt” flow. Not used today.",
    "agent.prompts.usage.no_source_reply":
      "When no KB/model/web sources apply, show this sentence to the user.",
    "agent.prompts.usage.ai_fail_reply": "When the AI API errors or times out, show this sentence to the user.",
    "agent.analytics.title": "Analytics",
    "agent.analytics.subtitle":
      "Visitor widget & AI support stats (calendar day in Shanghai; excludes internal “KB test” chats)",
    "agent.analytics.from": "From",
    "agent.analytics.to": "To",
    "agent.analytics.query": "Query",
    "agent.analytics.loading": "Loading…",
    "agent.analytics.empty": "No data",
    "agent.analytics.emptyOrFailed": "No data or failed to load",
    "agent.analytics.stat.widgetOpens": "Widget opens",
    "agent.analytics.stat.widgetOpensSub": "Requires frontend tracking; history may be 0",
    "agent.analytics.stat.sessions": "New sessions",
    "agent.analytics.stat.messages": "Messages",
    "agent.analytics.stat.aiReplies": "AI replies",
    "agent.analytics.stat.aiFailed": "AI failures",
    "agent.analytics.stat.aiFailureRate": "AI failure rate",
    "agent.analytics.stat.aiFailureRateSub": "Of AI reply rows",
    "agent.analytics.stat.kbHits": "KB hits",
    "agent.analytics.stat.kbHitRate": "KB hit rate",
    "agent.analytics.stat.kbHitRateSub": "Of successful AI replies",
    "agent.analytics.stat.maxAiRounds": "Max AI rounds / session",
    "agent.analytics.stat.maxAiRoundsSub": "One round = user + AI once",
    "agent.analytics.stat.sessionsWithAi": "Sessions with AI",
    "agent.analytics.stat.sessionsWithAiSub": "{{pct}} of new sessions",
    "agent.analytics.stat.aiToHuman": "AI → human (sessions)",
    "agent.analytics.stat.aiToHumanSub": "{{pct}} of sessions that had AI messages",
    "agent.analytics.stat.humanToAi": "Human → AI (sessions)",
    "agent.analytics.stat.humanToAiSub": "{{pct}} of sessions that had human messages",
    "agent.analytics.chart.widgetOpens": "Widget opens by day",
    "agent.analytics.chart.sessions": "New sessions by day",
    "agent.analytics.chart.messages": "Messages by day",
    "agent.analytics.chart.aiReplies": "AI replies by day",
    "common.irreversibleHint": "This action cannot be undone.",
    "chat.title": "Chat",
    "chat.mode.human": "Human",
    "chat.mode.ai": "AI",
  },
};

