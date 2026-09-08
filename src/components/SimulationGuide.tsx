import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  GitBranch,
  Globe,
  HelpCircle,
  Lightbulb,
  MessageSquareText,
  Rocket,
  Sparkles,
  UploadCloud,
  Wrench,
  Wand2,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SimulationGuideProps {
  lang: Language;
  onSubmit: () => void;
}

interface GuideStep {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}

const GUIDE_FILE = 'UNIVERSAL_EDUCATIONAL_SIMULATION_PROMPT_GUIDE_v4.md';

export const SimulationGuide: React.FC<SimulationGuideProps> = ({ lang, onSubmit }) => {
  const t = translations[lang];

  const steps: GuideStep[] = [
    {
      title: t.guideStep1T,
      desc: t.guideStep1D,
      icon: <FileText className="w-4 h-4" />,
      accent: 'bg-slate-900 text-white',
    },
    {
      title: t.guideStep2T,
      desc: t.guideStep2D,
      icon: <Bot className="w-4 h-4" />,
      accent: 'bg-indigo-600 text-white',
    },
    {
      title: t.guideStep3T,
      desc: t.guideStep3D,
      icon: <UploadCloud className="w-4 h-4" />,
      accent: 'bg-violet-600 text-white',
    },
    {
      title: t.guideStep4T,
      desc: t.guideStep4D,
      icon: <MessageSquareText className="w-4 h-4" />,
      accent: 'bg-emerald-600 text-white',
    },
    {
      title: t.guideStep5T,
      desc: t.guideStep5D,
      icon: <Wand2 className="w-4 h-4" />,
      accent: 'bg-amber-500 text-white',
    },
    {
      title: t.guideStep6T,
      desc: t.guideStep6D,
      icon: <ArrowRight className="w-4 h-4" />,
      accent: 'bg-rose-500 text-white',
    },
  ];

  const qaList = [t.guideQa1, t.guideQa2, t.guideQa3, t.guideQa4];
  const tipList = [t.guideTip1, t.guideTip2, t.guideTip3];

  const tools = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      name: t.guideToolStudio,
      desc: t.guideToolStudioDesc,
      url: 'https://aistudio.google.com',
      signup: t.guideToolStudioSignup,
      login: t.guideToolStudioLogin,
      accent: 'bg-violet-50 text-violet-600 border-violet-200',
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      name: t.guideToolGit,
      desc: t.guideToolGitDesc,
      url: 'https://github.com',
      signup: t.guideToolGitSignup,
      login: t.guideToolGitLogin,
      accent: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      name: t.guideToolVercel,
      desc: t.guideToolVercelDesc,
      url: 'https://vercel.com',
      signup: t.guideToolVercelSignup,
      login: t.guideToolVercelLogin,
      accent: 'bg-sky-50 text-sky-600 border-sky-200',
    },
  ];

  return (
    <div id="simulation-guide" className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {t.guideTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-2xl">
              {t.guideIntro}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Download the guide file */}
      <div id="guide-download" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {t.guideDownloadTitle}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
          {t.guideDownloadDesc}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <a
            href={'/' + GUIDE_FILE}
            download={GUIDE_FILE}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.guideDownloadBtn}</span>
          </a>
          <a
            href={'/' + GUIDE_FILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span className="font-mono text-[11px]">{GUIDE_FILE}</span>
          </a>
        </div>
      </div>

      {/* Section 2: Upload to AI */}
      <div id="guide-upload" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {t.guideUploadTitle}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {t.guideUploadDesc}
        </p>
      </div>

      {/* Section 3: Grant control & answer questions */}
      <div id="guide-qa" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {t.guideQaTitle}
          </h3>
        </div>
        <ul className="space-y-2.5">
          {qaList.map((item) => (
            <li key={item} className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Create simulation / game from original file */}
      <div id="guide-tips" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {t.guideTipsTitle}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {tipList.map((tip, idx) => (
            <div
              key={tip}
              className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start space-x-2.5"
            >
              <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center text-[11px] font-extrabold shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs text-slate-600 leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Tools journey Studio -> GitHub -> Vercel */}
      <div id="guide-tools" className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
            {t.guideToolsTitle}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
          {t.guideToolsDesc}
        </p>

        <div className="space-y-4">
          {tools.map((tool) => (
            <div key={tool.name} className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 sm:p-5">
              {/* Header tool: icon + tên + link */}
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tool.accent}`}
                >
                  {tool.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white">{tool.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{tool.url}</p>
                </div>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-300 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.guideToolOpenSite}</span>
                </a>
              </div>

              {/* Mô tả ngắn */}
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mb-3">
                {tool.desc}
              </p>

              {/* 3 bước: tạo tài khoản → đăng nhập → cách dùng */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wide">{t.guideToolSignupLabel}</span>
                    <span className="text-[11px] sm:text-xs text-slate-300 leading-relaxed block">{tool.signup}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-emerald-300 uppercase tracking-wide">{t.guideToolLoginLabel}</span>
                    <span className="text-[11px] sm:text-xs text-slate-300 leading-relaxed block">{tool.login}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">3</span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-amber-300 uppercase tracking-wide">{t.guideToolUseLabel}</span>
                    <span className="text-[11px] sm:text-xs text-slate-300 leading-relaxed block">{tool.desc}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {[t.guideToolStudio, t.guideToolGit, t.guideToolVercel].map((label, idx) => (
            <React.Fragment key={label}>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 text-slate-300 border border-slate-700">
                {idx === 0 ? (
                  <Sparkles className="w-3 h-3 text-violet-300" />
                ) : idx === 1 ? (
                  <GitBranch className="w-3 h-3 text-slate-300" />
                ) : (
                  <Rocket className="w-3 h-3 text-sky-300" />
                )}
                <span>{label}</span>
              </span>
              {idx < 2 && <span className="text-slate-600 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section 6: Share on this website */}
      <div id="guide-share" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {t.guideUploadSiteTitle}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
          {t.guideUploadSiteDesc}
        </p>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm shadow-slate-500/20 transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t.guideUploadSiteBtn}</span>
        </button>
      </div>

      {/* Final note */}
      <div className="mt-5 flex items-center justify-center text-[11px] sm:text-xs text-slate-500 text-center px-4">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
        <span>{t.guideTitle}</span>
      </div>
    </div>
  );
};