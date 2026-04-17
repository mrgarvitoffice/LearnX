

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NEWS_CATEGORIES, NEWS_COUNTRIES, COUNTRY_SPECIFIC_REGIONS, APP_LANGUAGES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from "@/components/ui/skeleton";

const ANY_COUNTRY_VALUE = "_any_country_";
const ANY_REGION_VALUE = "_any_region_";

interface NewsFiltersProps {
  filters: {
    query: string;
    country: string;
    stateOrRegion: string;
    city: string;
    category: string;
    language: string; // Added language
  };
  onFilterChange: (name: keyof NewsFiltersProps['filters'], value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading: boolean;
}

export function NewsFilters({ filters, onFilterChange, onApplyFilters, onResetFilters, isLoading }: NewsFiltersProps) {
  const { t, isReady } = useTranslation();
  
  if (!isReady) {
    return (
        <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="space-y-1.5"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-10 w-full" /></div>)}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Skeleton className="h-10 w-full sm:w-32" />
                <Skeleton className="h-10 w-full sm:w-32" />
            </div>
        </div>
    );
  }
  
  const isSpecificCountrySelected = !!filters.country && filters.country !== ANY_COUNTRY_VALUE;
  const availableRegions = isSpecificCountrySelected && COUNTRY_SPECIFIC_REGIONS[filters.country] 
    ? COUNTRY_SPECIFIC_REGIONS[filters.country] 
    : null;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="query">{t('news.filters.keywordsLabel')}</Label>
          <Input
            id="query"
            placeholder={t('news.filters.keywordsPlaceholder')}
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            disabled={isLoading}
            className="bg-input/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="language-select">{t('news.filters.languageLabel')}</Label>
          <Select
            value={filters.language || "en"} // Default to English
            onValueChange={(value) => onFilterChange('language', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="language-select" className="bg-input/50">
              <SelectValue placeholder={t('news.filters.languagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {APP_LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="category-select">{t('news.filters.categoryLabel')}</Label>
          <Select
            value={filters.category || "top"} 
            onValueChange={(value) => onFilterChange('category', value)} 
            disabled={isLoading}
          >
            <SelectTrigger id="category-select" className="bg-input/50">
              <SelectValue placeholder={t('news.filters.categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {NEWS_CATEGORIES.map(cat => ( 
                <SelectItem key={cat.value} value={cat.value}>{t(`news.categories.${cat.value}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <div className="space-y-1.5">
          <Label htmlFor="country-select">{t('news.filters.countryLabel')}</Label>
          <Select
            value={filters.country || ANY_COUNTRY_VALUE}
            onValueChange={(value) => onFilterChange('country', value === ANY_COUNTRY_VALUE ? "" : value)}
            disabled={isLoading}
          >
            <SelectTrigger id="country-select" className="bg-input/50">
              <SelectValue placeholder={t('news.filters.countryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_COUNTRY_VALUE}>{t('news.filters.anyCountry')}</SelectItem>
              {NEWS_COUNTRIES.map(country => (
                <SelectItem key={country.value} value={country.value}>{country.label} ({country.value.toUpperCase()})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stateOrRegion">{t(availableRegions ? 'news.filters.regionSelectLabel' : 'news.filters.regionTypeLabel')}</Label>
          {availableRegions ? (
            <Select
              value={filters.stateOrRegion || ANY_REGION_VALUE}
              onValueChange={(value) => onFilterChange('stateOrRegion', value === ANY_REGION_VALUE ? "" : value)}
              disabled={isLoading || !isSpecificCountrySelected}
            >
              <SelectTrigger id="stateOrRegion-select" className="bg-input/50" title={!isSpecificCountrySelected ? t('news.filters.regionSelectDisabledTooltip') : t('news.filters.regionSelectTooltip')}>
                <SelectValue placeholder={t(isSpecificCountrySelected ? 'news.filters.anyRegion' : 'news.filters.selectCountryFirst')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_REGION_VALUE}>{t('news.filters.anyRegion')}</SelectItem>
                {availableRegions.map(region => (
                  <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="stateOrRegion-input"
              placeholder={t(isSpecificCountrySelected ? 'news.filters.regionTypePlaceholder' : 'news.filters.selectCountryFirst')}
              value={filters.stateOrRegion}
              onChange={(e) => onFilterChange('stateOrRegion', e.target.value)}
              disabled={isLoading || !isSpecificCountrySelected}
              title={!isSpecificCountrySelected ? t('news.filters.regionTypeDisabledTooltip') : t('news.filters.regionTypeTooltip')}
              className="bg-input/50 disabled:opacity-50"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">{t('news.filters.cityLabel')}</Label>
          <Input
            id="city"
            placeholder={t(isSpecificCountrySelected ? 'news.filters.cityPlaceholder' : 'news.filters.selectCountryFirst')}
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            disabled={isLoading || !isSpecificCountrySelected}
            title={!isSpecificCountrySelected ? t('news.filters.cityDisabledTooltip') : t('news.filters.cityTooltip')}
            className="bg-input/50 disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button onClick={onApplyFilters} disabled={isLoading} className="flex-grow sm:flex-grow-0">
          {isLoading ? t('news.filters.loadingButton') : t('news.filters.applyButton')}
        </Button>
        <Button onClick={onResetFilters} variant="outline" disabled={isLoading} className="flex-grow sm:flex-grow-0">
          <RotateCcw className="w-4 h-4 mr-2" /> {t('news.filters.resetButton')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/80 mt-2">
        {t('news.filters.behaviorNote')}
      </p>
    </div>
  );
}

    