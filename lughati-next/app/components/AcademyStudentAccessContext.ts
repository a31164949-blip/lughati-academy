'use client';
import { createContext } from 'react';
// Shared by the outer admission gate and the pledge: no duplicate API reads.
export const AcademyStudentAccessContext = createContext(false);
