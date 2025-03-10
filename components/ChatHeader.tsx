'use client';

import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardHeader,
} from '@/components/ui/card';

interface ChatHeaderProps {
  title?: string;
  description?: string;
}

export function ChatHeader({ 
  title = 'Chat',
}: ChatHeaderProps) {
  return (
    <Card className="border-b rounded-t-lg rounded-b-none shadow-sm mb-0">
      <CardHeader className="py-2 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/#">Playground</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CardHeader>
    </Card>
  );
} 