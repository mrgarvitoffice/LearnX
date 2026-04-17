

"use client";

import React from 'react';
import { useTheme } from "next-themes";
import { useSettings } from '@/contexts/SettingsContext';
import { useSound } from '@/hooks/useSound';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsMenuContent() {
  const { t } = useTranslation();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { theme, setTheme } = useTheme();
  const { soundMode, setSoundMode, fontSize, setFontSize, appLanguage, setAppLanguage } = useSettings();

  const handleSoundModeChange = (value: string) => {
    playClickSound();
    setSoundMode(value as any);
  };
  
  const handleFontSizeChange = (value: string) => {
    playClickSound();
    setFontSize(value as any);
  };
  
  const handleThemeChange = (value: string) => {
    playClickSound();
    setTheme(value);
  }

  const handleLanguageChange = (value: string) => {
    playClickSound();
    setAppLanguage(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="language-setting">{t('header.appLanguage')}</Label>
        <Select value={appLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger id="language-setting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APP_LANGUAGES.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       <div className="space-y-2">
        <Label htmlFor="sound-setting">{t('header.soundMode')}</Label>
        <Select value={soundMode} onValueChange={handleSoundModeChange}>
          <SelectTrigger id="sound-setting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="essential">Essential</SelectItem>
            <SelectItem value="muted">Muted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
       <div className="space-y-2">
        <Label htmlFor="font-size-setting">{t('header.fontSize')}</Label>
        <Select value={fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger id="font-size-setting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
       <div className="space-y-2">
        <Label htmlFor="theme-setting">{t('header.theme')}</Label>
        <Select value={theme} onValueChange={handleThemeChange}>
          <SelectTrigger id="theme-setting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

    