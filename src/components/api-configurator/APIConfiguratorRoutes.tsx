import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { APIConfiguratorLayout } from './layout/APIConfiguratorLayout';
import { APIConfigList } from './APIConfigList';
import { APIConfigForm } from './APIConfigForm';

import  DslEditor  from '../rules/DslEditor';
export const APIConfiguratorRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<APIConfiguratorLayout />}>
        <Route index element={<APIConfigList />} />
        <Route path="new" element={<APIConfigForm isNew={true} />} />
        <Route path="edit/:route" element={<APIConfigForm isNew={false} />} />
        <Route path="/dsl-editor" element={<DslEditor />} />

      </Route>
    </Routes>
  );
};