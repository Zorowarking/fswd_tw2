import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { CategoryManager } from '@/components/admin/categories/category-manager';
import { getAdminCategories } from '@/app/actions/category-actions';

export const metadata: Metadata = {
  title: 'Service Categories | Campus Central Administration',
  description: 'Manage campus service categories, taxonomy, and catalog visibility.',
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Categories', href: '/admin/categories' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <CategoryManager initialCategories={categories} />
      </PageContainer>
    </PortalShell>
  );
}
