import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';

const FlagVN = () => (
  <svg viewBox="0 0 900 600" className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block align-middle" aria-hidden="true">
    <rect width="900" height="600" fill="#da251d" />
    <polygon
      fill="#ffff00"
      points="450,120 489.5,241.6 616.2,241.6 513.6,316.1 552.8,437.8 450,363.1 347.2,437.8 386.4,316.1 283.8,241.6 410.5,241.6"
    />
  </svg>
);

const FlagUK = () => (
  <svg viewBox="0 0 60 30" className="w-5 h-3.5 rounded-xs shrink-0 shadow-xs inline-block align-middle" aria-hidden="true">
    <clipPath id="uk-clip">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <clipPath id="uk-t">
      <path d="M30,15 h30 v15 z M30,15 h-30 v-15 z M30,15 h-30 v15 z M30,15 h30 v-15 z"/>
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-t)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

interface Option {
  code: 'vi' | 'en';
  label: string;
  Flag: React.ComponentType;
}

const OPTIONS: Option[] = [
  { code: 'vi', label: 'Tiếng Việt', Flag: FlagVN },
  { code: 'en', label: 'English', Flag: FlagUK },
];

export default function LanguageDropdown() {
  const { lang, setLang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = OPTIONS.find((o) => o.code === lang) || OPTIONS[0];
  const CurrentFlag = currentOption.Flag;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-slate-700 bg-slate-900/80 text-slate-200 text-xs font-medium hover:border-teal-400 hover:text-teal-300 transition-all shadow-sm focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <CurrentFlag />
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900/95 border border-slate-800 shadow-xl backdrop-blur-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {OPTIONS.map((opt) => {
            const isSelected = opt.code === lang;
            const OptFlag = opt.Flag;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLang(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/10 text-teal-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <OptFlag />
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <FontAwesomeIcon icon={faCheck} className="text-teal-400 text-xs" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

