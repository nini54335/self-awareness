const {
  useState,
  useEffect,
  useMemo
} = React;

/* ================= 常量与文案 ================= */
const SLOGAN = '看见困住你的信念，选择你想要的行动';
const BELIEF_OPTIONS = [{
  key: 'self_deny',
  label: '自我否定：我不够好、我能力差、我总是失败'
}, {
  key: 'catastrophe',
  label: '灾难化预判：这件事会带来很糟的后果，一切都会完蛋'
}, {
  key: 'past',
  label: '归因过去：因为过去的经历，所以我注定会遇到这种困境'
}, {
  key: 'please',
  label: '讨好型信念：我不能拒绝别人，我必须得到他人认可'
}, {
  key: 'binary',
  label: '非黑即白：要么完美，要么彻底失败'
}, {
  key: 'other',
  label: '其他（可自行填写）'
}];
const BRANCH_TIPS = {
  self_deny: '这是客观事实，还是你的主观解读？就像那只被拴住的大象，这类信念往往是过往留下的枷锁，不等于你的真实能力。试着想一想：放下“我不行”这个想法，你想要拥有什么样的状态？',
  catastrophe: '我们很容易脑补最坏结局。这个糟糕结果是确定会发生，还只是猜想？想一想：你紧抓这份担忧，是在守护什么样的期待？',
  past: '原因视角可以帮你理解感受。但如果一直停留在“因为过去，我只能这样”，容易陷入无力。切换视角看看：你希望自己接下来是什么状态？',
  please: '你很看重他人的评价。问问自己：你渴望获得认可背后，真正想要的是什么？这份期待，是否一定要靠讨好别人才能得到？',
  binary: '生活很少是非此即彼。这件事除了完美或彻底失败，有没有中间的可能性？坚持这种极端想法，它在帮你维持什么样的感受？',
  other: '观察这个信念。它是事实还是你的解读？跳出这个想法看一看：你希望自己走向何方？'
};
const BELIEF_LABELS = Object.fromEntries(BELIEF_OPTIONS.map(o => [o.key, o.label]));
const beliefShort = k => BELIEF_LABELS[k] ? BELIEF_LABELS[k].split('：')[0] : k;

/* 彩色标签配色：按文字 hash 固定颜色 */
const TAG_COLORS = ['bg-[#e2ebe2] text-[#557055]', 'bg-[#e7e4f1] text-[#6a6390]', 'bg-[#f2e8e4] text-[#9a6f5f]', 'bg-[#e2ebf2] text-[#5f7d9a]', 'bg-[#f2f0e2] text-[#8a8555]', 'bg-[#f2e2ec] text-[#9a5f83]'];
const tagColor = t => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = h * 31 + t.charCodeAt(i) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
};

/* ================= 本地存储工具 ================= */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmtTime = ts => new Date(ts).toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

/* ================= 通用小组件 ================= */
function Modal({
  children,
  onClose,
  wide
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4",
    style: {
      background: 'rgba(74,79,74,0.28)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `bg-paper rounded-2xl shadow-xl border border-sage-100 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[88vh] overflow-y-auto`
  }, children));
}
function Btn({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled
}) {
  const styles = {
    primary: 'bg-sage-500 text-white hover:bg-sage-600',
    ghost: 'bg-white text-sage-600 border border-sage-200 hover:bg-sage-50',
    text: 'text-sage-600 hover:text-sage-700 underline underline-offset-4',
    danger: 'text-red-400 hover:text-red-500 text-sm'
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    className: `px-5 py-2.5 rounded-full text-sm tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`
  }, children);
}
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4
}) {
  return /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    rows: rows,
    className: "w-full bg-white border border-sage-100 rounded-xl p-4 text-sm leading-relaxed placeholder:text-soft/60 focus:border-sage-300 resize-y"
  });
}
function Tag({
  children,
  onRemove
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-sage-50 text-sage-600 text-xs px-2.5 py-1 rounded-full border border-sage-100"
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    className: "text-sage-300 hover:text-sage-500"
  }, "×"));
}

/* 彩色标签 */
function ColorTag({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full ${tagColor(children)}`
  }, children);
}

/* ================= 欢迎弹窗 ================= */
function WelcomeModal({
  onEnter
}) {
  const [checked, setChecked] = useState(false);
  return /*#__PURE__*/React.createElement(Modal, {
    wide: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8 md:p-10"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-serif text-2xl md:text-3xl text-sage-700 text-center"
  }, "欢迎来到觉察练习空间"), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-soft mt-3 text-sm tracking-widest"
  }, "Slogan：", SLOGAN), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 space-y-5 text-sm leading-7 text-ink"
  }, /*#__PURE__*/React.createElement("p", null, "本网站是思维觉察练习工具，核心参考《被讨厌的勇气》阿德勒心理学，辅以信念觉察、事实与想法区分练习，帮助你觉察限制性信念，练习目的视角思考，把想法转化为行动。"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "mb-1"
  }, "你可以："), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1 text-ink/90"
  }, /*#__PURE__*/React.createElement("li", null, "• 填写觉察练习表单，记录事件、情绪与想法"), /*#__PURE__*/React.createElement("li", null, "• 存档回看你的全部觉察记录（游客仅本地保存，登录可云端同步）"), /*#__PURE__*/React.createElement("li", null, "• 在社区匿名/实名分享你的觉察复盘，互相启发"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50 border border-sage-100 rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sage-700 mb-1"
  }, "⚠️ 重要提示："), /*#__PURE__*/React.createElement("p", null, "本网站仅作为自我觉察练习工具，不是心理咨询，无法替代专业心理治疗。"), /*#__PURE__*/React.createElement("p", null, "如果你承受强烈痛苦、有自伤念头，请联系学校心理老师或专业心理机构。18岁以下建议在信任成年人陪伴下使用。"))), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2.5 mt-8 cursor-pointer select-none justify-center"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: e => setChecked(e.target.checked),
    className: "w-4 h-4 accent-sage-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "我已阅读并理解，同意继续使用")), /*#__PURE__*/React.createElement("div", {
    className: "text-center mt-5"
  }, /*#__PURE__*/React.createElement(Btn, {
    onClick: onEnter,
    disabled: !checked,
    className: "px-10"
  }, "进入网站"))));
}

/* ================= 登录弹窗 ================= */
function LoginModal({
  onClose,
  onLogin
}) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('请输入有效的邮箱地址');
    if (pwd.length < 6) return setErr('密码至少 6 位');
    const users = store.get('sa_users', {});
    if (users[email] && users[email].pwd !== pwd) return setErr('该邮箱已注册，密码不正确');
    if (!users[email]) {
      users[email] = {
        pwd
      };
      store.set('sa_users', users);
    }
    const user = {
      email,
      nickname: email.split('@')[0]
    };
    store.set('sa_user', user);
    onLogin(user);
  };
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-serif text-xl text-sage-700 text-center"
  }, "邮箱登录"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft text-center mt-2"
  }, "邮箱 + 密码即可，首次使用将自动注册"), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 space-y-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "邮箱",
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-3 text-sm focus:border-sage-300"
  }), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: pwd,
    onChange: e => setPwd(e.target.value),
    placeholder: "密码（至少 6 位）",
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-3 text-sm focus:border-sage-300",
    onKeyDown: e => e.key === 'Enter' && submit()
  }), err && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-red-400"
  }, err)), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 mt-6 justify-center"
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onClose
  }, "取消"), /*#__PURE__*/React.createElement(Btn, {
    onClick: submit
  }, "登录 / 注册"))));
}

/* ================= 顶部导航 ================= */
function Nav({
  page,
  setPage,
  user,
  onLoginClick,
  onLogout
}) {
  const items = [{
    key: 'archive',
    label: '我的存档'
  }, {
    key: 'practice',
    label: '觉察练习'
  }, {
    key: 'community',
    label: '社区'
  }];
  return /*#__PURE__*/React.createElement("header", {
    className: "fixed top-0 inset-x-0 z-40 bg-mist/90 backdrop-blur border-b border-sage-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-4 h-16 grid grid-cols-3 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs md:text-sm text-soft tracking-wider truncate pr-2"
  }, SLOGAN), /*#__PURE__*/React.createElement("nav", {
    className: "flex justify-center gap-1 md:gap-2"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.key,
    onClick: () => setPage(it.key),
    className: `px-3 md:px-4 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap ${page === it.key ? 'bg-sage-100 text-sage-700' : 'text-ink/70 hover:text-sage-600'}`
  }, it.label))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end items-center gap-2"
  }, user ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "hidden md:inline text-xs text-soft truncate max-w-[8rem]"
  }, user.nickname), /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    className: "text-xs text-sage-500 hover:text-sage-700 whitespace-nowrap"
  }, "退出")) : /*#__PURE__*/React.createElement("button", {
    onClick: onLoginClick,
    className: "text-xs text-sage-500 hover:text-sage-700 whitespace-nowrap"
  }, "登录"))));
}

/* ================= 模块1：觉察练习 ================= */
const emptyForm = {
  event: '',
  emotions: '',
  thoughts: '',
  beliefs: [],
  otherBelief: '',
  reflection: '',
  reframe: '',
  action: ''
};
const PRACTICE_NAV = ['① 客观记录事件', '② 写下当下的情绪', '③ 写下想法与信念', '④ 切换视角思考', '⑤ 重构后的想法'];
function PracticePage({
  onSaved,
  goArchive
}) {
  const [stage, setStage] = useState('intro'); // intro | step1..5 | done
  const [form, setForm] = useState({
    ...emptyForm
  });
  const [showFactTip, setShowFactTip] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [savedId, setSavedId] = useState(null); // 本次保存的存档 id，用于发布标记

  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const toggleBelief = key => setForm(f => ({
    ...f,
    beliefs: f.beliefs.includes(key) ? f.beliefs.filter(b => b !== key) : [...f.beliefs, key]
  }));
  const stepNum = stage.startsWith('step') ? Number(stage.slice(4)) : 0;
  const goTo = n => {
    setStage('step' + n);
    setTimeout(() => {
      const el = document.getElementById('practice-step-' + n);
      if (el) el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 60);
  };
  const save = () => {
    const records = store.get('sa_records', []);
    const rec = {
      ...form,
      id: uid(),
      tags: [],
      musing: '',
      musingSavedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    records.unshift(rec);
    store.set('sa_records', records);
    setSavedId(rec.id);
    setStage('done');
  };

  /* 发布后把对应存档标记为「已发布社区」，防止重复发布 */
  const markPublished = pid => {
    if (!savedId) return;
    const recs = store.get('sa_records', []).map(r => r.id === savedId ? {
      ...r,
      postId: pid,
      publishedAt: Date.now()
    } : r);
    store.set('sa_records', recs);
  };
  const restart = () => {
    setForm({
      ...emptyForm
    });
    setStage('intro');
  };

  /* 进入新步骤后，平滑滚动到对应表单位置 */
  useEffect(() => {
    if (!stage.startsWith('step')) return;
    const el = document.getElementById('practice-step-' + stage.slice(4));
    if (el) el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, [stage]);

  /* 步骤导航跳转 */
  const scrollToStep = n => {
    const el = document.getElementById('practice-step-' + n);
    if (el) el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  /* ---- 初始问候 ---- */
  if (stage === 'intro') {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "font-serif text-2xl md:text-3xl text-ink leading-relaxed"
    }, "你好！今天发生了什么事？", /*#__PURE__*/React.createElement("br", null), "你有什么想说的吗？"), /*#__PURE__*/React.createElement(Btn, {
      className: "mt-10 px-8",
      onClick: () => setStage('step1')
    }, "开始觉察练习"));
  }

  /* ---- 保存成功 ---- */
  if (stage === 'done') {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-[70vh] flex items-center justify-center px-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-paper border border-sage-100 rounded-2xl p-8 md:p-10 max-w-md w-full text-center shadow-sm"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-lg text-sage-700"
    }, "✅ 觉察记录已保存到你的存档。"), /*#__PURE__*/React.createElement("div", {
      className: "mt-8 flex flex-col gap-3"
    }, /*#__PURE__*/React.createElement(Btn, {
      variant: "ghost",
      onClick: goArchive
    }, "返回存档页查看"), /*#__PURE__*/React.createElement(Btn, {
      onClick: () => setPublishOpen(true)
    }, "发布到社区"), /*#__PURE__*/React.createElement(Btn, {
      variant: "ghost",
      onClick: restart
    }, "新建一次觉察练习"))), publishOpen && /*#__PURE__*/React.createElement(PublishModal, {
      form: form,
      onClose: () => setPublishOpen(false),
      onPublished: markPublished
    }));
  }

  /* ---- 分步表单：纵向追加 + 步骤导航 ---- */
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-xl mx-auto px-4 py-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap justify-center gap-2 mb-10"
  }, PRACTICE_NAV.map((label, i) => {
    const n = i + 1;
    const reached = n <= stepNum;
    return /*#__PURE__*/React.createElement("button", {
      key: n,
      disabled: !reached,
      onClick: () => scrollToStep(n),
      className: `px-3 py-1.5 rounded-full text-xs border transition-colors ${n === stepNum ? 'bg-sage-100 text-sage-700 border-sage-300' : reached ? 'bg-white text-sage-600 border-sage-200 hover:bg-sage-50' : 'text-soft/50 border-sage-100 cursor-not-allowed'}`
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, stepNum >= 1 && /*#__PURE__*/React.createElement("div", {
    id: "practice-step-1",
    className: "scroll-mt-20"
  }, /*#__PURE__*/React.createElement(StepCard, {
    title: "① 客观记录发生的事件"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-soft leading-relaxed"
  }, "只写下客观发生的事实，尽量不加入评价、猜测或情绪。"), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50 rounded-xl p-4 text-sm space-y-1.5 border border-sage-100"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-soft text-xs mb-1"
  }, "示例参考："), /*#__PURE__*/React.createElement("p", {
    className: "text-sage-700"
  }, "✅ 小组作业，我的方案被组员否决。"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink/50"
  }, "❌ 组员看不起我，直接否定我的想法。")), /*#__PURE__*/React.createElement(Textarea, {
    value: form.event,
    onChange: v => set('event', v),
    placeholder: "客观描述发生了什么……",
    rows: 5
  }), /*#__PURE__*/React.createElement(StepFooter, null, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => goTo(2),
    disabled: !form.event.trim()
  }, "下一步")))), stepNum >= 2 && /*#__PURE__*/React.createElement("div", {
    id: "practice-step-2",
    className: "scroll-mt-20"
  }, /*#__PURE__*/React.createElement(StepCard, {
    title: "② 写下当下的情绪"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-soft leading-relaxed"
  }, "觉察此刻你的感受，情绪没有好坏，允许它存在。可以写多个。"), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50 rounded-xl p-4 text-sm border border-sage-100"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-soft text-xs mb-1"
  }, "示例参考："), /*#__PURE__*/React.createElement("p", {
    className: "text-sage-700"
  }, "失落、委屈、不安、尴尬。")), /*#__PURE__*/React.createElement(Textarea, {
    value: form.emotions,
    onChange: v => set('emotions', v),
    placeholder: "此刻的情绪……"
  }), /*#__PURE__*/React.createElement(StepFooter, null, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => goTo(3),
    disabled: !form.emotions.trim()
  }, "下一步")))), stepNum >= 3 && /*#__PURE__*/React.createElement("div", {
    id: "practice-step-3",
    className: "scroll-mt-20"
  }, /*#__PURE__*/React.createElement(StepCard, {
    title: "③ 捕捉脑海里自动冒出来的想法与信念"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-soft leading-relaxed"
  }, "这件事发生后，第一时间冒出来的念头是什么？很多困住我们的限制性信念，就藏在这里。"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft"
  }, "提示：", /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowFactTip(s => !s),
    className: "inline-flex items-center justify-center w-4 h-4 rounded-full border border-sage-300 text-sage-500 text-[10px] align-middle mx-1 hover:bg-sage-50"
  }, "?"), showFactTip && /*#__PURE__*/React.createElement("span", {
    className: "block mt-2 bg-sage-50 border border-sage-100 rounded-xl p-3 leading-relaxed text-ink/80"
  }, "区分【事实】和【想法】。事实可被第三方验证；想法是你对事件的解读，不一定等于真相。")), /*#__PURE__*/React.createElement(Textarea, {
    value: form.thoughts,
    onChange: v => set('thoughts', v),
    placeholder: "脑海里自动冒出来的想法……"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, BELIEF_OPTIONS.map(o => /*#__PURE__*/React.createElement("label", {
    key: o.key,
    className: "flex items-start gap-2.5 cursor-pointer text-sm text-ink/85 leading-relaxed"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.beliefs.includes(o.key),
    onChange: () => toggleBelief(o.key),
    className: "mt-1 w-4 h-4 accent-sage-500 shrink-0"
  }), o.label)), form.beliefs.includes('other') && /*#__PURE__*/React.createElement("input", {
    value: form.otherBelief,
    onChange: e => set('otherBelief', e.target.value),
    placeholder: "请填写其他信念……",
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-2.5 text-sm focus:border-sage-300 ml-6",
    style: {
      width: 'calc(100% - 1.5rem)'
    }
  })), /*#__PURE__*/React.createElement(StepFooter, null, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => goTo(4),
    disabled: !form.thoughts.trim()
  }, "下一步")))), stepNum >= 4 && /*#__PURE__*/React.createElement("div", {
    id: "practice-step-4",
    className: "scroll-mt-20"
  }, /*#__PURE__*/React.createElement(StepCard, {
    title: "④ 两种视角，试着切换思考"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm leading-7 text-ink/90 space-y-3"
  }, /*#__PURE__*/React.createElement("p", null, "两种视角没有绝对对错。向后看可以理解感受来源；向前看，帮你找到想要的方向，拿回行动的主动权。"), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "- 向后看（原因视角）：是什么带来我当下的感受？"), /*#__PURE__*/React.createElement("li", null, "- 向前看（目的视角）：我在借助这份感受或想法，去往什么样的状态？（阿德勒目的论）"))), form.beliefs.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, form.beliefs.map(k => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "bg-sage-50 border border-sage-100 rounded-xl p-4 text-sm leading-relaxed"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-500 mb-1.5"
  }, "【", BELIEF_LABELS[k].split('：')[0], "】分支提示："), /*#__PURE__*/React.createElement("p", {
    className: "text-ink/90"
  }, BRANCH_TIPS[k])))), /*#__PURE__*/React.createElement(Textarea, {
    value: form.reflection,
    onChange: v => set('reflection', v),
    placeholder: "试着切换视角，写下你的思考……",
    rows: 5
  }), /*#__PURE__*/React.createElement(StepFooter, null, /*#__PURE__*/React.createElement(Btn, {
    onClick: () => goTo(5),
    disabled: !form.reflection.trim()
  }, "下一步")))), stepNum >= 5 && /*#__PURE__*/React.createElement("div", {
    id: "practice-step-5",
    className: "scroll-mt-20"
  }, /*#__PURE__*/React.createElement(StepCard, {
    title: "⑤ 重构想法，写下微小行动"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm leading-7 text-ink/90 space-y-2"
  }, /*#__PURE__*/React.createElement("p", null, "第一部分：写下新的、更贴合现实的想法，替换原本困住你的限制性信念。"), /*#__PURE__*/React.createElement("p", null, "第二部分：写下微小、今天或明天就能落地的行动。拒绝宏大口号，行动越小越容易实践。")), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50 rounded-xl p-4 text-sm space-y-1.5 border border-sage-100 text-ink/80"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-soft text-xs mb-1"
  }, "示例："), /*#__PURE__*/React.createElement("p", null, "重构想法：一次方案被否定 ≠ 我能力很差，只是这个方案不适合本次小组任务。"), /*#__PURE__*/React.createElement("p", null, "微小行动：明天找组员简单问问，他们不认可方案的具体原因。")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-sage-600 mb-1.5"
  }, "【重构后的想法】"), /*#__PURE__*/React.createElement(Textarea, {
    value: form.reframe,
    onChange: v => set('reframe', v),
    placeholder: "新的、更贴合现实的想法……"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-sage-600 mb-1.5"
  }, "【微小可执行行动】"), /*#__PURE__*/React.createElement(Textarea, {
    value: form.action,
    onChange: v => set('action', v),
    placeholder: "今天或明天就能做的一件小事……"
  })), /*#__PURE__*/React.createElement(StepFooter, null, /*#__PURE__*/React.createElement(Btn, {
    onClick: save,
    disabled: !form.reframe.trim() || !form.action.trim()
  }, "保存到我的存档"))))));
}
function StepCard({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-paper border border-sage-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-serif text-lg md:text-xl text-sage-700"
  }, title), children);
}
function StepFooter({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pt-2 text-right"
  }, children);
}

/* ================= 发布到社区弹窗 ================= */
const SECTION_FIELDS = [['event', '① 事件'], ['emotions', '② 情绪'], ['thoughts', '③ 想法与信念'], ['reflection', '④ 切换视角的思考'], ['reframe', '⑤ 重构后的想法'], ['action', '⑤ 微小行动']];
function PublishModal({
  form,
  onClose,
  onPublished
}) {
  const user = store.get('sa_user', null);
  const [isPublic, setIsPublic] = useState(true);
  const [anonymous, setAnonymous] = useState(true);
  const [nickname, setNickname] = useState(user ? user.nickname : '');
  const [allowComments, setAllowComments] = useState(true);
  const [showMusing, setShowMusing] = useState(true);
  const [title, setTitle] = useState(form.event ? form.event.split('\n')[0].slice(0, 30) : '');
  const [sections, setSections] = useState({
    event: true,
    emotions: true,
    thoughts: true,
    reflection: true,
    reframe: true,
    action: true
  });
  const [done, setDone] = useState(false);
  if (!user) {
    return /*#__PURE__*/React.createElement(Modal, {
      onClose: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "p-8 text-center space-y-4"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-sm leading-relaxed text-ink"
    }, "游客模式不能发布内容到社区。", /*#__PURE__*/React.createElement("br", null), "请先登录后再发布。"), /*#__PURE__*/React.createElement(Btn, {
      variant: "ghost",
      onClick: onClose
    }, "知道了")));
  }
  const publish = () => {
    const posts = store.get('sa_posts', []);
    const postId = uid();
    posts.unshift({
      id: postId,
      form: {
        ...form
      },
      public: isPublic,
      title: title.trim() || (form.event ? form.event.split('\n')[0].slice(0, 30) : '觉察笔记'),
      musing: form.musing || '',
      showMusing,
      visibleSections: sections,
      nickname: anonymous ? '匿名' : nickname.trim() || user.nickname,
      anonymous,
      allowComments,
      comments: [],
      pinnedCommentId: null,
      reports: 0,
      owner: user.email,
      createdAt: Date.now()
    });
    store.set('sa_posts', posts);
    if (onPublished) onPublished(postId);
    setDone(true);
  };
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8 space-y-5"
  }, done ? /*#__PURE__*/React.createElement("div", {
    className: "text-center space-y-4 py-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sage-700"
  }, "✅ 已发布到社区。"), /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onClose
  }, "关闭")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif text-lg text-sage-700 text-center"
  }, "发布到社区"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-sage-600 mb-1.5"
  }, "帖子标题（可自定义）"), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "给这条觉察笔记起个标题……",
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-2.5 text-sm focus:border-sage-300"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-600"
  }, "勾选需要对外公开展示的内容"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-x-3 gap-y-1.5"
  }, SECTION_FIELDS.map(([k, label]) => /*#__PURE__*/React.createElement("label", {
    key: k,
    className: "flex items-center gap-2 text-xs cursor-pointer text-ink/80"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: sections[k],
    onChange: e => setSections(s => ({
      ...s,
      [k]: e.target.checked
    })),
    className: "w-3.5 h-3.5 accent-sage-500"
  }), label)))), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2.5 text-sm cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: isPublic,
    onChange: e => setIsPublic(e.target.checked),
    className: "w-4 h-4 accent-sage-500"
  }), "是否公开（公开后所有人可见）"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2.5 text-sm cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: anonymous,
    onChange: e => setAnonymous(e.target.checked),
    className: "w-4 h-4 accent-sage-500"
  }), "匿名发布"), !anonymous && /*#__PURE__*/React.createElement("input", {
    value: nickname,
    onChange: e => setNickname(e.target.value),
    placeholder: "自定义昵称",
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-2.5 text-sm focus:border-sage-300"
  })), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2.5 text-sm cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: allowComments,
    onChange: e => setAllowComments(e.target.checked),
    className: "w-4 h-4 accent-sage-500"
  }), "是否允许评论"), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2.5 text-sm cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: showMusing,
    onChange: e => setShowMusing(e.target.checked),
    className: "w-4 h-4 accent-sage-500"
  }), "是否展示随想板块内容"), !showMusing && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft -mt-2 ml-6"
  }, "取消勾选后，社区公开帖子不展示随想内容，仅保留在你的个人存档内。"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-soft leading-relaxed bg-sage-50 border border-sage-100 rounded-xl p-3"
  }, "本内容属于个人自我觉察记录，本站仅为自助练习工具，不能替代专业心理咨询。"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 justify-center pt-2"
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onClose
  }, "取消"), /*#__PURE__*/React.createElement(Btn, {
    onClick: publish
  }, "确认发布")))));
}

/* ================= 模块2：我的存档 ================= */
function ArchivePage({
  user
}) {
  const [records, setRecords] = useState(() => store.get('sa_records', []));
  const [editing, setEditing] = useState(null); // record being edited
  const [detailId, setDetailId] = useState(null); // 详情弹窗中的记录 id
  const [confirmId, setConfirmId] = useState(null); // 待二次确认删除的记录 id
  const [view, setView] = useState('list'); // list | tree
  const [activeTag, setActiveTag] = useState(null); // null = 全部存档

  const persist = recs => {
    setRecords(recs);
    store.set('sa_records', recs);
  };
  const update = rec => persist(records.map(r => r.id === rec.id ? rec : r));
  const remove = id => setConfirmId(id);
  const doRemove = () => {
    persist(records.filter(r => r.id !== confirmId));
    setDetailId(null);
    setConfirmId(null);
  };
  const saveEdit = rec => {
    persist(records.map(r => r.id === rec.id ? {
      ...rec,
      updatedAt: Date.now()
    } : r));
    setEditing(null);
  };

  /* 默认按创建时间倒序，最新在前 */
  const sorted = useMemo(() => [...records].sort((a, b) => b.createdAt - a.createdAt), [records]);
  /* 从所有存档收集标签，生成筛选栏 */
  const allTags = useMemo(() => [...new Set(records.flatMap(r => r.tags))], [records]);
  const filtered = useMemo(() => activeTag ? sorted.filter(r => r.tags.includes(activeTag)) : sorted, [sorted, activeTag]);
  const detail = records.find(r => r.id === detailId) || null;
  const chipCls = on => `px-3 py-1.5 rounded-full text-xs border transition-colors ${on ? 'bg-sage-100 text-sage-700 border-sage-300' : 'bg-white text-sage-600 border-sage-200 hover:bg-sage-50'}`;
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto px-4 py-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-8"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-serif text-2xl text-sage-700"
  }, "我的存档"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft mt-3 leading-relaxed"
  }, user ? '登录用户：数据云端保存，可以跨设备访问，拥有社区发帖权限。' : '游客模式：数据保存在浏览器 LocalStorage，换设备 / 清缓存数据会丢失。登录后可云端同步。')), records.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-soft text-sm py-20"
  }, "还没有觉察记录。去「觉察练习」写下第一条吧。") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 mb-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveTag(null),
    className: chipCls(!activeTag)
  }, "全部存档"), allTags.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setActiveTag(activeTag === t ? null : t),
    className: chipCls(activeTag === t)
  }, t)), /*#__PURE__*/React.createElement("span", {
    className: "ml-auto flex gap-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('list'),
    className: chipCls(view === 'list')
  }, "列表"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('tree'),
    className: chipCls(view === 'tree')
  }, "成长树"))), view === 'tree' ? /*#__PURE__*/React.createElement(GrowthTree, {
    records: filtered,
    onOpen: id => setDetailId(id)
  }) : filtered.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-soft text-sm py-14"
  }, "该标签下还没有存档。") : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-5"
  }, filtered.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    onClick: () => setDetailId(r.id),
    className: "bg-paper border border-sage-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-sage-200 transition-all flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5 mb-3 min-h-[20px]"
  }, r.tags.map(t => /*#__PURE__*/React.createElement(ColorTag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("h3", {
    className: "font-serif text-lg text-ink leading-snug line-clamp-2"
  }, r.event), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 space-y-1.5 text-xs text-ink/65 leading-relaxed"
  }, r.emotions && r.emotions.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "情绪："), r.emotions), r.thoughts && r.thoughts.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "想法："), r.thoughts), r.reframe && r.reframe.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "重构后的想法："), r.reframe), r.musing && r.musing.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "随想："), r.musing)), /*#__PURE__*/React.createElement("p", {
    className: "mt-auto pt-3 text-[11px] text-soft flex items-center gap-2 flex-wrap"
  }, fmtTime(r.createdAt), r.updatedAt !== r.createdAt && '（已编辑）', r.postId && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] px-1.5 py-px rounded-full bg-sage-100 text-sage-600"
  }, "已发布社区")))))), detail && /*#__PURE__*/React.createElement(ArchiveDetail, {
    record: detail,
    user: user,
    onUpdate: update,
    onRemove: () => remove(detail.id),
    onEdit: () => setEditing({
      ...detail
    }),
    onClose: () => setDetailId(null)
  }), editing && /*#__PURE__*/React.createElement(EditModal, {
    record: editing,
    onChange: setEditing,
    onSave: () => saveEdit(editing),
    onClose: () => setEditing(null)
  }), confirmId && /*#__PURE__*/React.createElement(ConfirmModal, {
    text: "确定删除这条觉察记录吗？删除后无法恢复。",
    onCancel: () => setConfirmId(null),
    onConfirm: doRemove
  }));
}

/* 二次确认弹窗 */
function ConfirmModal({
  text,
  onCancel,
  onConfirm
}) {
  return /*#__PURE__*/React.createElement(Modal, {
    onClose: onCancel
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8 text-center space-y-5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-ink leading-relaxed"
  }, text), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 justify-center"
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onCancel
  }, "取消"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onConfirm
  }, "确认删除"))));
}

/* 成长树视图：时间线 + 标签分类，可折叠，附简单统计（仅可视化展示，不做心理诊断） */
function GrowthTree({
  records,
  onOpen
}) {
  const [collapsed, setCollapsed] = useState({});

  /* 按标签分组，组内保持时间倒序 */
  const groups = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      const keys = r.tags.length ? r.tags : ['未标记'];
      keys.forEach(t => {
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(r);
      });
    });
    return [...map.entries()];
  }, [records]);

  /* 标签分布统计 */
  const tagStats = useMemo(() => {
    const m = new Map();
    records.forEach(r => r.tags.forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-paper border border-sage-100 rounded-2xl p-5 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-sage-700"
  }, "累计觉察 ", /*#__PURE__*/React.createElement("span", {
    className: "font-serif text-lg"
  }, records.length), " 次"), tagStats.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-x-3 gap-y-1.5"
  }, tagStats.map(([t, n]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "inline-flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(ColorTag, null, t), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-soft"
  }, "×", n))))), groups.map(([tag, recs]) => {
    const isCollapsed = !!collapsed[tag];
    return /*#__PURE__*/React.createElement("div", {
      key: tag
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setCollapsed(c => ({
        ...c,
        [tag]: !isCollapsed
      })),
      className: "flex items-center gap-2 mb-3 w-full text-left"
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-sage-400 text-xs transition-transform ${isCollapsed ? '' : 'rotate-90'}`
    }, "▶"), /*#__PURE__*/React.createElement(ColorTag, null, tag), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-soft"
    }, recs.length, " 条记录")), !isCollapsed && /*#__PURE__*/React.createElement("div", {
      className: "ml-2 border-l-2 border-sage-100 pl-4 space-y-3"
    }, recs.map(r => /*#__PURE__*/React.createElement("button", {
      key: r.id,
      onClick: () => onOpen(r.id),
      className: "block w-full text-left bg-paper border border-sage-100 rounded-xl px-4 py-3 hover:border-sage-200 hover:shadow-sm transition-all"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-soft"
    }, fmtTime(r.createdAt)), /*#__PURE__*/React.createElement("p", {
      className: "font-serif text-sm text-ink leading-snug mt-0.5 line-clamp-1"
    }, r.event ? r.event.split('\n')[0] : '觉察记录'), r.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1 mt-1.5"
    }, r.tags.map(t => /*#__PURE__*/React.createElement(ColorTag, {
      key: t
    }, t)))))));
  }));
}

/* 存档详情弹窗：完整记录 + 随想板块 + 发布入口 */
function ArchiveDetail({
  record,
  user,
  onUpdate,
  onRemove,
  onEdit,
  onClose
}) {
  const [musingDraft, setMusingDraft] = useState(record.musing || '');
  const [tagDraft, setTagDraft] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const saveMusing = () => {
    onUpdate({
      ...record,
      musing: musingDraft,
      musingSavedAt: Date.now()
    });
  };
  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || record.tags.includes(t)) return;
    onUpdate({
      ...record,
      tags: [...record.tags, t]
    });
    setTagDraft('');
  };
  const removeTag = t => onUpdate({
    ...record,
    tags: record.tags.filter(x => x !== t)
  });
  return /*#__PURE__*/React.createElement(Modal, {
    wide: true,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-7 md:p-9 space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, record.tags.map(t => /*#__PURE__*/React.createElement(ColorTag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, user && !record.postId && /*#__PURE__*/React.createElement("button", {
    onClick: () => setPublishOpen(true),
    className: "text-xs px-3 py-1.5 rounded-full bg-sage-100 text-sage-700 hover:bg-sage-200 transition-colors"
  }, "发布到社区"), record.postId && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] px-2 py-1 rounded-full bg-sage-100 text-sage-600"
  }, "已发布到社区"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-soft hover:text-ink text-lg leading-none"
  }, "×"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-serif text-xl text-ink leading-snug"
  }, record.event), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft mt-2 flex items-center gap-2 flex-wrap"
  }, fmtTime(record.createdAt), record.updatedAt !== record.createdAt && '（已编辑）', record.postId && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] px-1.5 py-px rounded-full bg-sage-100 text-sage-600"
  }, "已发布社区"))), /*#__PURE__*/React.createElement(RecordBody, {
    form: record
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5 pt-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-600"
  }, "自定义标签"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, record.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    onRemove: () => removeTag(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: tagDraft,
    onChange: e => setTagDraft(e.target.value),
    onKeyDown: e => e.key === 'Enter' && addTag(),
    placeholder: "添加自定义标签，回车确认",
    className: "flex-1 bg-white border border-sage-100 rounded-full px-4 py-1.5 text-xs focus:border-sage-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addTag,
    className: "text-xs text-sage-500 hover:text-sage-700 px-2"
  }, "添加"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50/70 border border-sage-100 rounded-2xl p-5 space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-sage-700"
  }, "随想"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft mt-0.5"
  }, "可在日后翻看时填写，记录你的成长足迹")), /*#__PURE__*/React.createElement(Textarea, {
    value: musingDraft,
    onChange: setMusingDraft,
    placeholder: "此刻想补充的任何文字……",
    rows: 4
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-soft"
  }, record.musingSavedAt ? `上次保存：${fmtTime(record.musingSavedAt)}` : '还没有保存过随想'), /*#__PURE__*/React.createElement(Btn, {
    onClick: saveMusing,
    disabled: musingDraft === (record.musing || '')
  }, "保存随想"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3 justify-center pt-2"
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onEdit
  }, "编辑记录"), /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    className: "text-xs text-red-300 hover:text-red-400 px-2"
  }, "删除记录"))), publishOpen && /*#__PURE__*/React.createElement(PublishModal, {
    form: record,
    onClose: () => setPublishOpen(false),
    onPublished: pid => onUpdate({
      ...record,
      postId: pid,
      publishedAt: Date.now()
    })
  }));
}
function RecordBody({
  form,
  visible
}) {
  const show = k => !visible || visible[k] !== false;
  const rows = [['① 事件', form.event, 'event'], ['② 情绪', form.emotions, 'emotions'], ['③ 想法与信念', form.thoughts, 'thoughts'], ['④ 切换视角的思考', form.reflection, 'reflection'], ['⑤ 重构后的想法', form.reframe, 'reframe'], ['⑤ 微小行动', form.action, 'action']];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, rows.map(([label, val, k]) => show(k) && val && val.trim() && /*#__PURE__*/React.createElement("div", {
    key: label
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-500 mb-1"
  }, label), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-ink/90 leading-relaxed whitespace-pre-wrap"
  }, val))), show('thoughts') && form.beliefs && form.beliefs.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-500 mb-1.5"
  }, "③ 勾选的信念"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, form.beliefs.map(k => /*#__PURE__*/React.createElement(Tag, {
    key: k
  }, k === 'other' && form.otherBelief ? `其他：${form.otherBelief}` : BELIEF_LABELS[k].split('：')[0])))));
}
function EditModal({
  record,
  onChange,
  onSave,
  onClose,
  title,
  onTitleChange
}) {
  const set = (k, v) => onChange({
    ...record,
    [k]: v
  });
  const fields = [['event', '① 事件'], ['emotions', '② 情绪'], ['thoughts', '③ 想法与信念'], ['reflection', '④ 切换视角的思考'], ['reframe', '⑤ 重构后的想法'], ['action', '⑤ 微小行动']];
  return /*#__PURE__*/React.createElement(Modal, {
    wide: true,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-8 space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif text-lg text-sage-700 text-center"
  }, "编辑"), onTitleChange && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-sage-600 mb-1.5"
  }, "帖子标题"), /*#__PURE__*/React.createElement("input", {
    value: title,
    onChange: e => onTitleChange(e.target.value),
    className: "w-full bg-white border border-sage-100 rounded-xl px-4 py-2.5 text-sm focus:border-sage-300"
  })), fields.map(([k, label]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-sage-600 mb-1.5"
  }, label), /*#__PURE__*/React.createElement(Textarea, {
    value: record[k],
    onChange: v => set(k, v),
    rows: 3
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 justify-center pt-2"
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: onClose
  }, "取消"), /*#__PURE__*/React.createElement(Btn, {
    onClick: onSave
  }, "保存修改"))));
}

/* ================= 模块3：社区 ================= */
const postTitle = p => p.title || (p.form.event ? p.form.event.split('\n')[0].slice(0, 30) : '觉察笔记');
const postTags = p => (p.form.beliefs || []).map(k => k === 'other' && p.form.otherBelief ? `其他：${p.form.otherBelief}` : beliefShort(k));
function CommunityPage({
  user
}) {
  const [posts, setPosts] = useState(() => store.get('sa_posts', []));
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [editingPost, setEditingPost] = useState(null); // { id, title, form }
  const [confirmId, setConfirmId] = useState(null); // 待二次确认删除的帖子 id

  const persist = ps => {
    setPosts(ps);
    store.set('sa_posts', ps);
  };
  const updatePost = np => persist(posts.map(x => x.id === np.id ? np : x));
  const removePost = () => {
    persist(posts.filter(p => p.id !== confirmId));
    setDetailId(null);
    setConfirmId(null);
  };
  const savePostEdit = () => {
    persist(posts.map(p => p.id === editingPost.id ? {
      ...p,
      title: editingPost.title.trim() || p.title,
      form: {
        ...editingPost.form
      }
    } : p));
    setEditingPost(null);
  };

  /* 按发布时间倒序，最新发布在前 */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (!p.public) return false;
      if (!q) return true;
      const hay = [postTitle(p), p.nickname, p.form.event, p.form.emotions, p.form.thoughts, p.form.reflection, p.form.reframe, p.form.action, p.showMusing !== false ? p.musing || '' : '', ...(p.form.beliefs || []).map(k => BELIEF_LABELS[k])].join(' ').toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, query]);
  const report = id => {
    if (!confirm('确定举报这条笔记吗？')) return;
    persist(posts.map(p => p.id === id ? {
      ...p,
      reports: p.reports + 1
    } : p));
    alert('已收到举报，感谢反馈。');
  };
  const detail = posts.find(p => p.id === detailId) || null;
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto px-4 py-10 space-y-14"
  }, /*#__PURE__*/React.createElement("section", {
    className: "bg-paper border border-sage-100 rounded-2xl p-7 md:p-10 shadow-sm max-w-3xl mx-auto w-full"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-serif text-2xl text-sage-700 text-center"
  }, "开发者有话说"), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 space-y-4 text-sm leading-7 text-ink/90"
  }, /*#__PURE__*/React.createElement("p", null, "欢迎来到这个觉察练习空间。"), /*#__PURE__*/React.createElement("p", null, "很多时候，困住我们的不是发生的事，而是我们看待它的方式。"), /*#__PURE__*/React.createElement("p", null, "或许你读过《被讨厌的勇气》？在理解目的论、意识到困住自己的其实是限制性信念之后——就像那只从小被拴住的大象，长大之后绳索早已解开，却依然坚信自己无法逃走——你是否想要进一步练习自我觉察，成为自己想法与信念的主人，活出你想要的自我？"), /*#__PURE__*/React.createElement("p", null, "这正是这个网站想要做到的事：它不是心理课程，也不是鸡汤文集，而是一套可以反复使用的练习工具。", /*#__PURE__*/React.createElement("br", null), "我们的核心逻辑：一件事本身并不会决定你的感受与行动，真正起作用的，是你对这件事的信念与解读。"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "mb-1"
  }, "你可以练习两种视角："), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "- 向后看（原因视角）：理解感受从何而来；"), /*#__PURE__*/React.createElement("li", null, "- 向前看（目的视角）：看见自己想要去往哪里，拿回选择行动的主动权。（这也是阿德勒的主张）"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "mb-1"
  }, "网站功能简要说明："), /*#__PURE__*/React.createElement("ol", {
    className: "space-y-1 list-none"
  }, /*#__PURE__*/React.createElement("li", null, "1. 觉察练习表单：跟着步骤记录事件、情绪，捕捉隐藏的信念，切换视角思考，写下微小行动。"), /*#__PURE__*/React.createElement("li", null, "2. 个人存档：游客模式下记录保存在当前浏览器；注册登录后，记录云端保存，跨设备可用。你可以随时编辑、回看过往所有觉察笔记。"), /*#__PURE__*/React.createElement("li", null, "3. 社区分享：写完觉察记录后，可以选择是否公开、是否匿名发布。在这里大家交流练习心得、觉察复盘，互相启发。"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50 border border-sage-100 rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sage-700 mb-1"
  }, "⚠️ 重要提醒再次说明："), /*#__PURE__*/React.createElement("p", null, "本站仅用于自我觉察思维练习，不是心理咨询，不能替代专业心理帮助。"), /*#__PURE__*/React.createElement("p", null, "如果你长期深陷痛苦、存在自伤想法，请寻求学校心理老师或正规心理咨询师的帮助。未成年人建议在信任成年人陪伴下使用。")), /*#__PURE__*/React.createElement("p", null, "希望在这里，你能慢慢看见那些困住你的信念，一点点选择你想要的行动。"))), /*#__PURE__*/React.createElement("section", {
    className: "max-w-3xl mx-auto w-full"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-serif text-xl text-sage-700 mb-4"
  }, "开发者示例觉察笔记"), /*#__PURE__*/React.createElement("div", {
    className: "border border-dashed border-sage-200 rounded-2xl p-10 text-center text-soft text-sm bg-paper/60"
  }, "示例笔记即将填入，敬请期待。")), /*#__PURE__*/React.createElement("section", {
    className: "max-w-3xl mx-auto w-full"
  }, /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "搜索帖子标题或正文关键词……",
    className: "w-full bg-paper border border-sage-100 rounded-full px-5 py-3 text-sm focus:border-sage-300 shadow-sm"
  })), /*#__PURE__*/React.createElement("section", null, filtered.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-soft text-sm py-14"
  }, query ? '没有找到匹配的公开笔记。' : '社区还没有公开笔记。完成一次觉察练习后，可以把你的复盘发布到这里。') : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  }, filtered.map(p => /*#__PURE__*/React.createElement("article", {
    key: p.id,
    onClick: () => setDetailId(p.id),
    className: "bg-paper border border-sage-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-sage-200 transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5 mb-2.5 min-h-[20px]"
  }, postTags(p).slice(0, 3).map(t => /*#__PURE__*/React.createElement(ColorTag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("h3", {
    className: "font-serif text-base text-ink leading-snug line-clamp-2"
  }, postTitle(p)), /*#__PURE__*/React.createElement("div", {
    className: "mt-2.5 space-y-1.5 text-xs text-ink/65 leading-relaxed"
  }, p.form.event && p.form.event.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "事件："), p.form.event), p.form.thoughts && p.form.thoughts.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "想法："), p.form.thoughts), p.form.reframe && p.form.reframe.trim() && /*#__PURE__*/React.createElement("p", {
    className: "line-clamp-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sage-500"
  }, "重构后的想法："), p.form.reframe)), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 pt-3 border-t border-sage-50 flex items-center justify-between gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center text-sage-500 text-[10px] font-serif shrink-0"
  }, p.nickname[0] || '匿'), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-ink/80 truncate"
  }, p.nickname), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-soft whitespace-nowrap"
  }, fmtTime(p.createdAt))), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-soft whitespace-nowrap"
  }, p.allowComments ? `评论 ${p.comments.length}` : '评论已关闭')))))), detail && /*#__PURE__*/React.createElement(PostDetail, {
    post: detail,
    user: user,
    onUpdate: updatePost,
    onReport: () => report(detail.id),
    onClose: () => setDetailId(null),
    onEdit: () => setEditingPost({
      id: detail.id,
      title: postTitle(detail),
      form: {
        ...detail.form
      }
    }),
    onDelete: () => setConfirmId(detail.id)
  }), editingPost && /*#__PURE__*/React.createElement(EditModal, {
    record: editingPost.form,
    title: editingPost.title,
    onTitleChange: t => setEditingPost({
      ...editingPost,
      title: t
    }),
    onChange: f => setEditingPost({
      ...editingPost,
      form: f
    }),
    onSave: savePostEdit,
    onClose: () => setEditingPost(null)
  }), confirmId && /*#__PURE__*/React.createElement(ConfirmModal, {
    text: "确定删除这条社区帖子吗？删除后无法恢复。",
    onCancel: () => setConfirmId(null),
    onConfirm: removePost
  }));
}

/* 帖子详情：完整全部内容 + 评论区 */
function PostDetail({
  post,
  user,
  onUpdate,
  onReport,
  onClose,
  onEdit,
  onDelete
}) {
  const isOwner = user && user.email === post.owner;
  return /*#__PURE__*/React.createElement(Modal, {
    wide: true,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-7 md:p-9 space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, postTags(post).map(t => /*#__PURE__*/React.createElement(ColorTag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-soft hover:text-ink text-lg leading-none shrink-0"
  }, "×")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-serif text-xl text-ink leading-snug"
  }, postTitle(post)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center text-sage-500 text-[10px] font-serif"
  }, post.nickname[0] || '匿'), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-ink/80"
  }, post.nickname), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-soft"
  }, fmtTime(post.createdAt)), /*#__PURE__*/React.createElement("span", {
    className: "ml-auto flex items-center gap-3"
  }, isOwner && /*#__PURE__*/React.createElement("button", {
    onClick: onEdit,
    className: "text-[11px] text-sage-500 hover:text-sage-700"
  }, "编辑"), isOwner && /*#__PURE__*/React.createElement("button", {
    onClick: onDelete,
    className: "text-[11px] text-red-300 hover:text-red-400"
  }, "删除"), /*#__PURE__*/React.createElement("button", {
    onClick: onReport,
    className: "text-[11px] text-soft hover:text-red-400"
  }, "举报")))), /*#__PURE__*/React.createElement(RecordBody, {
    form: post.form,
    visible: post.visibleSections
  }), post.showMusing !== false && post.musing && post.musing.trim() && /*#__PURE__*/React.createElement("div", {
    className: "bg-sage-50/70 border border-sage-100 rounded-2xl p-5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-sage-700 mb-2"
  }, "随想"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-ink/85 leading-relaxed whitespace-pre-wrap"
  }, post.musing)), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 border-t border-sage-50"
  }, post.allowComments ? /*#__PURE__*/React.createElement(CommentSection, {
    post: post,
    user: user,
    isOwner: isOwner,
    onUpdate: onUpdate
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-soft"
  }, "作者已关闭评论"))));
}
function CommentSection({
  post,
  user,
  isOwner,
  onUpdate
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const nickname = user ? user.nickname : '匿名访客';
    const isPostOwner = user && user.email === post.owner;
    onUpdate({
      ...post,
      comments: [...post.comments, {
        id: uid(),
        nickname,
        text: t,
        isOwner: !!isPostOwner,
        createdAt: Date.now()
      }]
    });
    setText('');
  };
  const togglePin = cid => onUpdate({
    ...post,
    pinnedCommentId: post.pinnedCommentId === cid ? null : cid
  });
  const sorted = [...post.comments].sort((a, b) => {
    const ap = a.id === post.pinnedCommentId ? 0 : 1;
    const bp = b.id === post.pinnedCommentId ? 0 : 1;
    return ap - bp || a.createdAt - b.createdAt;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-3 space-y-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-sage-600"
  }, "评论（", post.comments.length, "）"), sorted.map(c => {
    const pinned = c.id === post.pinnedCommentId;
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: `rounded-xl px-4 py-2.5 ${pinned ? 'bg-sage-50 border border-sage-200' : 'bg-sage-50/60'}`
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-sage-600 flex items-center gap-1.5 flex-wrap"
    }, c.nickname, c.isOwner && /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] px-1.5 py-px rounded bg-sage-200 text-sage-700"
    }, "帖主"), pinned && /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] px-1.5 py-px rounded bg-sage-500 text-white"
    }, "置顶"), /*#__PURE__*/React.createElement("span", {
      className: "text-soft"
    }, "· ", fmtTime(c.createdAt)), isOwner && /*#__PURE__*/React.createElement("button", {
      onClick: () => togglePin(c.id),
      className: "ml-auto text-[11px] text-sage-400 hover:text-sage-600"
    }, pinned ? '取消置顶' : '置顶')), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-ink/90 mt-0.5 leading-relaxed"
    }, c.text));
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => e.key === 'Enter' && submit(),
    placeholder: "写下你的评论……",
    className: "flex-1 bg-white border border-sage-100 rounded-full px-4 py-2 text-sm focus:border-sage-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    className: "text-sm text-sage-500 hover:text-sage-700 px-2"
  }, "发送")));
}

/* ================= 应用入口 ================= */
function App() {
  const [agreed, setAgreed] = useState(() => store.get('sa_agreed', false));
  const [page, setPage] = useState('practice');
  const [user, setUser] = useState(() => store.get('sa_user', null));
  const [loginOpen, setLoginOpen] = useState(false);
  const enter = () => {
    store.set('sa_agreed', true);
    setAgreed(true);
    setPage('practice');
  };
  const logout = () => {
    store.set('sa_user', null);
    setUser(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "font-sans min-h-screen"
  }, !agreed && /*#__PURE__*/React.createElement(WelcomeModal, {
    onEnter: enter
  }), /*#__PURE__*/React.createElement(Nav, {
    page: page,
    setPage: setPage,
    user: user,
    onLoginClick: () => setLoginOpen(true),
    onLogout: logout
  }), /*#__PURE__*/React.createElement("main", {
    className: "pt-16 pb-16"
  }, page === 'practice' && /*#__PURE__*/React.createElement(PracticePage, {
    goArchive: () => setPage('archive')
  }), page === 'archive' && /*#__PURE__*/React.createElement(ArchivePage, {
    user: user
  }), page === 'community' && /*#__PURE__*/React.createElement(CommunityPage, {
    user: user
  })), /*#__PURE__*/React.createElement("footer", {
    className: "text-center pb-8 text-xs text-soft/70 leading-relaxed px-4"
  }, "觉察练习空间 · 本站仅为自我觉察练习工具，不能替代专业心理帮助"), loginOpen && /*#__PURE__*/React.createElement(LoginModal, {
    onClose: () => setLoginOpen(false),
    onLogin: u => {
      setUser(u);
      setLoginOpen(false);
    }
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));