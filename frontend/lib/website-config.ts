/**
 * 官网配置文件
 * 请根据实际情况修改以下配置
 */

export const websiteConfig = {
  // GitHub 仓库地址
  github: {
    repo: "https://github.com/2930134478/AI-CS",
    releases: "https://github.com/2930134478/AI-CS/releases",
    issues: "https://github.com/2930134478/AI-CS/issues",
    readme: "https://github.com/2930134478/AI-CS/blob/master/README.md",
  },
  
  // 联系方式
  contact: {
    email: "contact@example.com", // 可选：邮箱地址
    wechat: "", // 可选：微信号或微信群链接
  },
  
  // 友情链接（用于互相引流）
  // 格式：{ name: "链接名称", url: "链接地址" }
  friendLinks: [
    // 示例：添加您的友情链接
    // { name: "合作伙伴1", url: "https://example.com" },
    // { name: "合作伙伴2", url: "https://example2.com" },
  ] as Array<{ name: string; url: string }>,
  
  // 其他配置
  copyright: {
    company: "AI-CS 智能客服系统", // 公司/产品名称
    year: new Date().getFullYear(),
  },
};

