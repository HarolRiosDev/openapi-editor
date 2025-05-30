import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SchemasComponent } from './schemas/schemas.component';
import { EndpointsComponent } from './endpoints/endpoints.component';
import { CodeViewComponent } from './code-view/code-view.component';
import { TagsComponent } from './tags/tags.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  { path: 'components', component: SchemasComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: 'code-view', component: CodeViewComponent },
  { path: 'tags', component: TagsComponent },
  { path: '**', redirectTo: '' }
];
