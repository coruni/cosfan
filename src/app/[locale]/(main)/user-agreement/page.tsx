import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal');
  
  return {
    title: t('userAgreement.title'),
    description: t('userAgreement.description'),
  };
}

export default async function UserAgreementPage() {
  const t = await getTranslations('legal.userAgreement');
  
  return (
    <div className="container py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('lastUpdated')}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <section>
            <h2>{t('section1.title')}</h2>
            <p>{t('section1.content')}</p>
          </section>

          <section>
            <h2>{t('section2.title')}</h2>
            <p>{t('section2.content')}</p>
          </section>

          <section>
            <h2>{t('section3.title')}</h2>
            <p>{t('section3.content')}</p>
          </section>

          <section>
            <h2>{t('section4.title')}</h2>
            <p>{t('section4.content')}</p>
          </section>

          <section>
            <h2>{t('section5.title')}</h2>
            <p>{t('section5.content')}</p>
          </section>

          <section>
            <h2>{t('section6.title')}</h2>
            <p>{t('section6.content')}</p>
          </section>

          <section>
            <h2>{t('section7.title')}</h2>
            <p>{t('section7.content')}</p>
          </section>

          <section>
            <h2>{t('section8.title')}</h2>
            <p>{t('section8.content')}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
