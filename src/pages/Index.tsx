import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { PageHeader } from '@/components/PageHeader';
import { Document, CategoryType } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MetadataSidebar } from '@/components/MetadataSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShareModal } from '@/components/ShareModal';
import { buildTree, TreeNode } from '@/utils/buildTree';
import { useShare } from '@/hooks/useShare';
import { Button } from '@/components/ui/button';
import { Plus, Share } from "lucide-react";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, File, FileSpreadsheet, FileImage, Folder, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnhancedFolderTree } from '@/components/EnhancedFolderTree';


interface BackendDocument {
  owner_id: string;
  name: string;
  file_path: string;
  created_at: string;
  size: number;
  file_type: string;
  tags: string[] | null;
  categories: string[] | null;
  status: string;
  file_hash: string;
  access_to: string[] | null;
  id: string;
  parent_id: string | null;
}
const mockDocuments: Document[] = [
  {
    "id": "d1ab4a7f-c7c2-4fa2-8d97-00e57f0fcbb7",
    "name": "Топология для СКС, СВН, СКУД.pdf",
    "type": "file",
    "size": "335.17 KB",
    "modified": "2025-07-18T05:16:21.386081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Топология для СКС, СВН, СКУД.pdf",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "357eb066-13ef-4c39-8f0d-16419ee46ef1",
    "name": "Вендор лист Завод Пепси (1).pdf",
    "type": "file",
    "size": "106.47 KB",
    "modified": "2025-07-18T05:16:21.376081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Вендор лист Завод Пепси (1).pdf",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "29ccdadc-ecff-4483-b65c-d28ef10d95b6",
    "name": "Топология для АПС, СОУЭ, ОС.pdf",
    "type": "file",
    "size": "145.73 KB",
    "modified": "2025-07-18T05:16:21.385081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Топология для АПС, СОУЭ, ОС.pdf",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "86ad332e-699c-41e5-9e26-bb9eefc5e6ed",
    "name": "PepsiCO Полученные разделы.xlsx",
    "type": "file",
    "size": "13.87 KB",
    "modified": "2025-07-18T05:16:21.376081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "PepsiCO Полученные разделы.xlsx",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "dbf1ce82-1afc-4342-9360-5fb2dda3338f",
    "name": "Пояснительная_записка_PepsiCo_final.pdf",
    "type": "file",
    "size": "235.33 KB",
    "modified": "2025-07-18T05:16:21.384081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Пояснительная_записка_PepsiCo_final.pdf",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "6ac608f5-1217-44a5-ac50-51340597e316",
    "name": "Пояснительная_записка_PepsiCo",
    "type": "folder",
    "size": "882.91 KB",
    "modified": "2025-07-18T05:16:21.383081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Пояснительная_записка_PepsiCo/",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "89d0b4f0-b770-4c60-bc9b-afa088cf7f63",
    "name": "Пояснительная_записка_PepsiCo.docx",
    "type": "file",
    "size": "322.25 KB",
    "modified": "2025-07-18T05:16:21.380081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Пояснительная_записка_PepsiCo/Пояснительная_записка_PepsiCo.docx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6ac608f5-1217-44a5-ac50-51340597e316"
  },
  {
    "id": "df050670-3189-4591-8d8f-16e81f4069b6",
    "name": "Пояснительная_записка_PepsiCo_final.docx",
    "type": "file",
    "size": "325.33 KB",
    "modified": "2025-07-18T05:16:21.382081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Пояснительная_записка_PepsiCo/Пояснительная_записка_PepsiCo_final.docx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6ac608f5-1217-44a5-ac50-51340597e316"
  },
  {
    "id": "911ba0fb-b041-4a2b-a038-8eeff8677645",
    "name": "Пояснительная_записка_PepsiCo_final.pdf",
    "type": "file",
    "size": "235.33 KB",
    "modified": "2025-07-18T05:16:21.383081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "Пояснительная_записка_PepsiCo/Пояснительная_записка_PepsiCo_final.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6ac608f5-1217-44a5-ac50-51340597e316"
  },
  {
    "id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66",
    "name": "1.Исх данные",
    "type": "folder",
    "size": "803.10 MB",
    "modified": "2025-07-18T05:16:18.605030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "d973f816-89de-415a-829f-74d63f03a2de",
    "name": "ПЛАН СХЕМА ПРОИЗВ PEPSI.jpg",
    "type": "file",
    "size": "653.83 KB",
    "modified": "2025-07-18T05:16:18.401026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ПЛАН СХЕМА ПРОИЗВ PEPSI.jpg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "4cffd891-cafe-4eb6-b086-7a97a1c273d7",
    "name": "Автоматизация раздел (КАЗГОР)",
    "type": "folder",
    "size": "22.94 MB",
    "modified": "2025-07-18T05:16:18.253024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "b2027964-5424-4217-88bc-3892244976cd",
    "name": "ADU-АДУ-Автоматическое дымоудаление",
    "type": "folder",
    "size": "5.07 MB",
    "modified": "2025-07-18T05:16:18.206023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4cffd891-cafe-4eb6-b086-7a97a1c273d7"
  },
  {
    "id": "fbadad3c-22a5-4b53-a61e-cca7f4d4ea21",
    "name": "7886-1.1-ADU",
    "type": "folder",
    "size": "1.74 MB",
    "modified": "2025-07-18T05:16:18.195023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.1-ADU/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b2027964-5424-4217-88bc-3892244976cd"
  },
  {
    "id": "d74c5530-1aa1-48c8-9b15-fba1d7bdd462",
    "name": "7886-1.1-ADU.pdf",
    "type": "file",
    "size": "1.74 MB",
    "modified": "2025-07-18T05:16:18.197023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.1-ADU/7886-1.1-ADU.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fbadad3c-22a5-4b53-a61e-cca7f4d4ea21"
  },
  {
    "id": "d09aa172-6db9-4aff-8b1b-c3294bb9f5a7",
    "name": "7886-1.3-ADU",
    "type": "folder",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:18.207023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.3-ADU/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b2027964-5424-4217-88bc-3892244976cd"
  },
  {
    "id": "a5b57596-64b1-4513-b67f-1257b32d37ee",
    "name": "7886-1.3-ADU.pdf",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:18.208023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.3-ADU/7886-1.3-ADU.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d09aa172-6db9-4aff-8b1b-c3294bb9f5a7"
  },
  {
    "id": "d8cd915d-3db7-4e4c-8c7b-2bc538d3d07d",
    "name": "7886-1.2-ADU",
    "type": "folder",
    "size": "2.14 MB",
    "modified": "2025-07-18T05:16:18.200023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.2-ADU/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b2027964-5424-4217-88bc-3892244976cd"
  },
  {
    "id": "84f03740-04ff-4ee1-af4b-34470ba3ca18",
    "name": "7886-1.2-ADU.pdf",
    "type": "file",
    "size": "2.14 MB",
    "modified": "2025-07-18T05:16:18.204023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/ADU-АДУ-Автоматическое дымоудаление/7886-1.2-ADU/7886-1.2-ADU.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d8cd915d-3db7-4e4c-8c7b-2bc538d3d07d"
  },
  {
    "id": "1a3d6e40-d13f-4772-b8d8-943d59f20ae2",
    "name": "AVK-АВК-Автоматизация комплексная",
    "type": "folder",
    "size": "4.40 MB",
    "modified": "2025-07-18T05:16:18.254024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AVK-АВК-Автоматизация комплексная/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4cffd891-cafe-4eb6-b086-7a97a1c273d7"
  },
  {
    "id": "ce76bd42-e8ff-438e-bcf4-f04b89a4343a",
    "name": "7886-8-AVK",
    "type": "folder",
    "size": "4.40 MB",
    "modified": "2025-07-18T05:16:18.255024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AVK-АВК-Автоматизация комплексная/7886-8-AVK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1a3d6e40-d13f-4772-b8d8-943d59f20ae2"
  },
  {
    "id": "0a49d734-2722-4b57-b468-4f1eb464375b",
    "name": "7886-8.1-8.2-8.3-AVK.SO.pdf",
    "type": "file",
    "size": "4.40 MB",
    "modified": "2025-07-18T05:16:18.260024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AVK-АВК-Автоматизация комплексная/7886-8-AVK/7886-8.1-8.2-8.3-AVK.SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ce76bd42-e8ff-438e-bcf4-f04b89a4343a"
  },
  {
    "id": "208a9b9b-3727-4434-be7e-6c8b21005e8a",
    "name": "AOV-АОВ-Автоматическое газообноружение",
    "type": "folder",
    "size": "13.46 MB",
    "modified": "2025-07-18T05:16:18.238024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4cffd891-cafe-4eb6-b086-7a97a1c273d7"
  },
  {
    "id": "b2e25644-b1f0-4192-bffa-b6a7ca0452f9",
    "name": "7886-3-AOV",
    "type": "folder",
    "size": "5.44 MB",
    "modified": "2025-07-18T05:16:18.240024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-3-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "208a9b9b-3727-4434-be7e-6c8b21005e8a"
  },
  {
    "id": "d2508e6f-e403-4786-85f8-61594448d97e",
    "name": "7886-3-AOV.pdf",
    "type": "file",
    "size": "5.44 MB",
    "modified": "2025-07-18T05:16:18.248024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-3-AOV/7886-3-AOV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b2e25644-b1f0-4192-bffa-b6a7ca0452f9"
  },
  {
    "id": "56e2d329-2e82-4e65-9c61-f84c3e4442f2",
    "name": "7886-1.1-AOV",
    "type": "folder",
    "size": "4.54 MB",
    "modified": "2025-07-18T05:16:18.213023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-1.1-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "208a9b9b-3727-4434-be7e-6c8b21005e8a"
  },
  {
    "id": "a33b8bac-aa39-4ee3-899e-b2f4675f5d5c",
    "name": "7886-1.1-AOV",
    "type": "folder",
    "size": "4.54 MB",
    "modified": "2025-07-18T05:16:18.214023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-1.1-AOV/7886-1.1-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "56e2d329-2e82-4e65-9c61-f84c3e4442f2"
  },
  {
    "id": "b77dc475-52f7-4d1a-88ca-7adefcc2629b",
    "name": "7886-1.1-AOV.SO.pdf",
    "type": "file",
    "size": "4.54 MB",
    "modified": "2025-07-18T05:16:18.221023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-1.1-AOV/7886-1.1-AOV/7886-1.1-AOV.SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "a33b8bac-aa39-4ee3-899e-b2f4675f5d5c"
  },
  {
    "id": "588ff38a-cbe9-4aee-8707-0129f43e5f1a",
    "name": "7886-10-AOV",
    "type": "folder",
    "size": "3.49 MB",
    "modified": "2025-07-18T05:16:18.227023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-10-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "208a9b9b-3727-4434-be7e-6c8b21005e8a"
  },
  {
    "id": "c21662fc-8188-4351-bdb4-ad6e94d8269e",
    "name": "7886-10-AOV",
    "type": "folder",
    "size": "3.49 MB",
    "modified": "2025-07-18T05:16:18.228023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-10-AOV/7886-10-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "588ff38a-cbe9-4aee-8707-0129f43e5f1a"
  },
  {
    "id": "4415a9d4-1a6c-45f4-b9d5-59563864f576",
    "name": "7886_10_AOV.SO.pdf",
    "type": "file",
    "size": "3.49 MB",
    "modified": "2025-07-18T05:16:18.234023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Автоматизация раздел (КАЗГОР)/AOV-АОВ-Автоматическое газообноружение/7886-10-AOV/7886-10-AOV/7886_10_AOV.SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c21662fc-8188-4351-bdb4-ad6e94d8269e"
  },
  {
    "id": "d7474074-e19f-4795-af26-3cd049081b4f",
    "name": "ЭОМ разделы (КАЗГОР)",
    "type": "folder",
    "size": "633.55 MB",
    "modified": "2025-07-18T05:16:19.216042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "7d832176-b33b-481c-b8a0-d4d84082ee9f",
    "name": "7886-8.1-EOM",
    "type": "folder",
    "size": "29.44 MB",
    "modified": "2025-07-18T05:16:19.150040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "c6471db1-8b89-4863-b23f-070342bf4045",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "1.99 MB",
    "modified": "2025-07-18T05:16:19.148040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d832176-b33b-481c-b8a0-d4d84082ee9f"
  },
  {
    "id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945",
    "name": "DWG",
    "type": "folder",
    "size": "27.45 MB",
    "modified": "2025-07-18T05:16:19.215041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d832176-b33b-481c-b8a0-d4d84082ee9f"
  },
  {
    "id": "99fa9a78-066d-488c-b436-40fa4cd83f3e",
    "name": "7886-8.1-EOM_Oblozhka_A2.dwg",
    "type": "file",
    "size": "82.89 KB",
    "modified": "2025-07-18T05:16:19.213041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "1856211b-74d3-4ecc-bfe4-ab9cf9a1b265",
    "name": "7886-8.1-EOM_10-11_Moln_Vvod_A3.dwg",
    "type": "file",
    "size": "2.74 MB",
    "modified": "2025-07-18T05:16:19.209041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_10-11_Moln_Vvod_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "a85eff63-a823-4906-add7-b53b19b6461a",
    "name": "7886-8.1-EOM_03-04_Sh_VRU8.1-DGU_A2.dwg",
    "type": "file",
    "size": "317.04 KB",
    "modified": "2025-07-18T05:16:19.154040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_03-04_Sh_VRU8.1-DGU_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "b5188f88-8b23-4e6c-938b-6981e1d4fb5d",
    "name": "7886-8.1-EOM_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.16 KB",
    "modified": "2025-07-18T05:16:19.212041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "8bc370b6-6222-4b55-be74-c1ad2b8bb5f7",
    "name": "7886-8.1-EOM_08_osv_A2.dwg",
    "type": "file",
    "size": "528.44 KB",
    "modified": "2025-07-18T05:16:19.159040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_08_osv_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "b0040f2f-9e22-4f22-96e9-f045d1ffa2f8",
    "name": "7886-8.1-EOM_01_Obdan_A3.dwg",
    "type": "file",
    "size": "196.35 KB",
    "modified": "2025-07-18T05:16:19.151040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_01_Obdan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "8cc0c93f-c74f-4e6a-8fc2-60ff23314f2c",
    "name": "7886-8.1-EOM_05_Shema SHR_A2.dwg",
    "type": "file",
    "size": "259.11 KB",
    "modified": "2025-07-18T05:16:19.155040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_05_Shema SHR_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "c5011b05-7e44-40f3-a79a-1ce0be093820",
    "name": "7886-8.1-EOM_Titulniy_A1.dwg",
    "type": "file",
    "size": "85.44 KB",
    "modified": "2025-07-18T05:16:19.214041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "d1992ac9-5669-48a4-8ca8-dbc64e0a11a6",
    "name": "7886-8.1-EOM_09_uzly_A2.dwg",
    "type": "file",
    "size": "22.38 MB",
    "modified": "2025-07-18T05:16:19.194041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_09_uzly_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "1bea3dd3-3f13-4ec4-97b0-508ff44b1a90",
    "name": "7886-8.1-EOM_02_Obdan_A4.dwg",
    "type": "file",
    "size": "180.62 KB",
    "modified": "2025-07-18T05:16:19.152040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_02_Obdan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "0eb5c916-9b4f-44bb-a8ab-ec688f809786",
    "name": "7886-8.1-EOM_07_SIlov_A2.dwg",
    "type": "file",
    "size": "357.07 KB",
    "modified": "2025-07-18T05:16:19.157040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_07_SIlov_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "819e0510-ce2c-4a23-91db-737826fd04eb",
    "name": "7886-8.1-EOM_Titulniy_A2.dwg",
    "type": "file",
    "size": "82.67 KB",
    "modified": "2025-07-18T05:16:19.215041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "9ff9a36d-07c5-4177-bfe8-e8e383e22834",
    "name": "7886-8.1-EOM_06_Shema SHV-1_A2.dwg",
    "type": "file",
    "size": "217.92 KB",
    "modified": "2025-07-18T05:16:19.156040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-8.1-EOM/DWG/7886-8.1-EOM_06_Shema SHV-1_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c2b5155-621a-4ffa-885e-9ca20b4aa945"
  },
  {
    "id": "9d4121e0-52bf-4d94-83dd-ee92fc91ec9e",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "23.36 MB",
    "modified": "2025-07-18T05:16:18.917036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "1662a212-909d-4b2a-a316-445c6e427737",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "23.36 MB",
    "modified": "2025-07-18T05:16:18.938036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9d4121e0-52bf-4d94-83dd-ee92fc91ec9e"
  },
  {
    "id": "0c9c0e57-abff-4f1b-a44c-87614ae6768d",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:18.927036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1662a212-909d-4b2a-a316-445c6e427737"
  },
  {
    "id": "55fd0f78-b1af-4d4e-be8f-342a461108a5",
    "name": "7886-3-EOM_AN.pdf",
    "type": "file",
    "size": "6.07 MB",
    "modified": "2025-07-18T05:16:18.935036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/7886-3-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1662a212-909d-4b2a-a316-445c6e427737"
  },
  {
    "id": "cfe9263c-a32a-42ef-82b1-8871284c81ba",
    "name": "DWG",
    "type": "folder",
    "size": "11.12 MB",
    "modified": "2025-07-18T05:16:18.979037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1662a212-909d-4b2a-a316-445c6e427737"
  },
  {
    "id": "8480ff14-856b-46e7-9191-4b9457ea3d07",
    "name": "7886-3-ЭОМ_SO.xls",
    "type": "file",
    "size": "1.05 MB",
    "modified": "2025-07-18T05:16:18.973037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-ЭОМ_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "42b18b34-c880-4232-a105-b5fbf4b248bf",
    "name": "7886-3-EOM_12_Pl_urav_A3.dwg",
    "type": "file",
    "size": "313.65 KB",
    "modified": "2025-07-18T05:16:18.946037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_12_Pl_urav_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "43772de7-5b90-4bc6-b152-6fd99094e85a",
    "name": "7886-3-EOM_15_Pl_TE_A1.dwg",
    "type": "file",
    "size": "3.06 MB",
    "modified": "2025-07-18T05:16:18.952037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_15_Pl_TE_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "31e62547-2d19-438e-9422-5b91ab16dfef",
    "name": "7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "type": "file",
    "size": "281.27 KB",
    "modified": "2025-07-18T05:16:18.954037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "333844c2-3169-4b3a-9e93-d68249dc6233",
    "name": "7886-3_0_Titulniy_A2.dwg",
    "type": "file",
    "size": "92.42 KB",
    "modified": "2025-07-18T05:16:18.977037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3_0_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "dc87ab0f-c0ba-4c5f-8a7b-4108e1dedcd6",
    "name": "7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "type": "file",
    "size": "241.92 KB",
    "modified": "2025-07-18T05:16:18.960037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "8bef1cbf-3ed2-4018-91c0-977c92ca69f3",
    "name": "7886-3-EOM_8_Pl_sila_A1.dwg",
    "type": "file",
    "size": "842.39 KB",
    "modified": "2025-07-18T05:16:18.967037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_8_Pl_sila_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "dc30e071-af23-47e1-bb9d-f3368f80a1df",
    "name": "7886-3_0_Oblozhka_A2.dwg",
    "type": "file",
    "size": "90.47 KB",
    "modified": "2025-07-18T05:16:18.975037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3_0_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "05ebbd73-e881-41e2-9a26-a48a2b3a62d2",
    "name": "2.png",
    "type": "file",
    "size": "108.11 KB",
    "modified": "2025-07-18T05:16:18.940036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/2.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "8262c687-28cc-43bb-a071-a41e330a60af",
    "name": "1.png",
    "type": "file",
    "size": "37.75 KB",
    "modified": "2025-07-18T05:16:18.939036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/1.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "f562190a-e9c4-4dbc-86eb-3b09e5828f4d",
    "name": "7886-3-EOM_11_Pl_zaz_A1.dwg",
    "type": "file",
    "size": "1.44 MB",
    "modified": "2025-07-18T05:16:18.944036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_11_Pl_zaz_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "d7ae2771-3714-4c5d-87a1-0cb0000db015",
    "name": "7886-3-EOM_13_Pl_lot_A1.dwg",
    "type": "file",
    "size": "398.55 KB",
    "modified": "2025-07-18T05:16:18.948036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_13_Pl_lot_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "2ee5b68a-bd00-4856-9700-7691c771d625",
    "name": "7886-3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "231.10 KB",
    "modified": "2025-07-18T05:16:18.955037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "af325214-828e-4d3d-9b6d-524311dcdce2",
    "name": "7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "type": "file",
    "size": "291.62 KB",
    "modified": "2025-07-18T05:16:18.965037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "72e4afe4-b569-4d81-a51b-695438db26f2",
    "name": "7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "type": "file",
    "size": "213.23 KB",
    "modified": "2025-07-18T05:16:18.963037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "1bdaa608-e7a5-44ed-b18a-1abb1c6a3c64",
    "name": "7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "type": "file",
    "size": "230.43 KB",
    "modified": "2025-07-18T05:16:18.957037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "18b7092b-b77e-460a-bb39-0b97c88c8ee5",
    "name": "Ввод зазем.png",
    "type": "file",
    "size": "40.56 KB",
    "modified": "2025-07-18T05:16:18.979037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/Ввод зазем.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "2ca89702-f72e-48d8-bbd9-07c9ae1c0d79",
    "name": "7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "type": "file",
    "size": "196.91 KB",
    "modified": "2025-07-18T05:16:18.949037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "7e8d391b-9552-4693-9952-620cc73f4dc0",
    "name": "7886-3-EOM_10_Pl_osv_A1.dwg",
    "type": "file",
    "size": "779.00 KB",
    "modified": "2025-07-18T05:16:18.942036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_10_Pl_osv_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "56caf781-a3fb-440f-9bad-3cab389af4e6",
    "name": "7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "type": "file",
    "size": "235.60 KB",
    "modified": "2025-07-18T05:16:18.959037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "3e0aae3e-c44c-47e0-83a9-a5a923ca12c7",
    "name": "7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "type": "file",
    "size": "832.26 KB",
    "modified": "2025-07-18T05:16:18.970037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "436c09d0-30ec-4a42-bcd9-ad61d1fdf360",
    "name": "7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "type": "file",
    "size": "244.92 KB",
    "modified": "2025-07-18T05:16:18.956037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cfe9263c-a32a-42ef-82b1-8871284c81ba"
  },
  {
    "id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1",
    "name": "архив",
    "type": "folder",
    "size": "384.50 MB",
    "modified": "2025-07-18T05:16:19.631049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "96ec878b-28d7-408a-a7e4-dc349933420f",
    "name": "7886-8.1-EOM",
    "type": "folder",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:19.622049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-8.1-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "df6e37bc-0d5f-4c16-ac05-115f2c5fedd8",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:19.626049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-8.1-EOM/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "96ec878b-28d7-408a-a7e4-dc349933420f"
  },
  {
    "id": "e4f4f50c-5345-414e-914a-86f1ab5dcc6d",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "17.29 MB",
    "modified": "2025-07-18T05:16:19.535047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "78381446-6fc8-406a-bb35-386e488cd0a2",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:19.529047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e4f4f50c-5345-414e-914a-86f1ab5dcc6d"
  },
  {
    "id": "0a66eb85-db06-451a-979f-c4fca3f45850",
    "name": "DWG",
    "type": "folder",
    "size": "11.12 MB",
    "modified": "2025-07-18T05:16:19.590048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e4f4f50c-5345-414e-914a-86f1ab5dcc6d"
  },
  {
    "id": "669b6706-3621-4f38-b229-cfe0bd4901d1",
    "name": "7886-3-ЭОМ_SO.xls",
    "type": "file",
    "size": "1.05 MB",
    "modified": "2025-07-18T05:16:19.583048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-ЭОМ_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "5a3693dc-7150-4ffd-a3de-1a8d628ccdb2",
    "name": "7886-3-EOM_12_Pl_urav_A3.dwg",
    "type": "file",
    "size": "313.65 KB",
    "modified": "2025-07-18T05:16:19.544048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_12_Pl_urav_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "b98a9ead-52eb-495d-bd23-958b0595a95d",
    "name": "7886-3-EOM_15_Pl_TE_A1.dwg",
    "type": "file",
    "size": "3.06 MB",
    "modified": "2025-07-18T05:16:19.554048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_15_Pl_TE_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "bd647c15-4b23-44b3-8cc0-ae740213fd36",
    "name": "7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "type": "file",
    "size": "281.27 KB",
    "modified": "2025-07-18T05:16:19.557048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "006559cf-17bb-4da5-8894-cd8b611b5335",
    "name": "7886-3_0_Titulniy_A2.dwg",
    "type": "file",
    "size": "92.42 KB",
    "modified": "2025-07-18T05:16:19.587048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3_0_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "05c16c0a-8239-460b-8634-c193e0ad27dd",
    "name": "7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "type": "file",
    "size": "241.92 KB",
    "modified": "2025-07-18T05:16:19.565048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "3484c619-85c6-4b2c-8b4f-8f22899efab1",
    "name": "7886-3-EOM_8_Pl_sila_A1.dwg",
    "type": "file",
    "size": "842.39 KB",
    "modified": "2025-07-18T05:16:19.575048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_8_Pl_sila_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "b2e5b9f3-45eb-4cea-9e38-c2515af5c873",
    "name": "7886-3_0_Oblozhka_A2.dwg",
    "type": "file",
    "size": "90.47 KB",
    "modified": "2025-07-18T05:16:19.585048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3_0_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "802fa6ec-6799-4531-b0ca-1c64121ec689",
    "name": "2.png",
    "type": "file",
    "size": "108.11 KB",
    "modified": "2025-07-18T05:16:19.538047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/2.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "14767602-7422-4f25-b7b5-da31fc0326d5",
    "name": "1.png",
    "type": "file",
    "size": "37.75 KB",
    "modified": "2025-07-18T05:16:19.537047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/1.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "bc3b4240-e1ce-4fb4-a382-6d4e1f99db3d",
    "name": "7886-3-EOM_11_Pl_zaz_A1.dwg",
    "type": "file",
    "size": "1.44 MB",
    "modified": "2025-07-18T05:16:19.542048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_11_Pl_zaz_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "4c3e5510-8748-4405-989a-b2ec15d1c586",
    "name": "7886-3-EOM_13_Pl_lot_A1.dwg",
    "type": "file",
    "size": "398.55 KB",
    "modified": "2025-07-18T05:16:19.546047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_13_Pl_lot_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "8a763dfd-b27b-4296-8bb4-574a9e1d0d84",
    "name": "7886-3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "231.10 KB",
    "modified": "2025-07-18T05:16:19.558048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "6a197cf8-21df-481c-8e2b-4281ec83de42",
    "name": "7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "type": "file",
    "size": "291.62 KB",
    "modified": "2025-07-18T05:16:19.569048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "5a69dfea-b727-4d52-bf74-e24679e486e3",
    "name": "7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "type": "file",
    "size": "213.23 KB",
    "modified": "2025-07-18T05:16:19.567048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "30c4b552-8edd-47f3-9816-8a9dade401b0",
    "name": "7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "type": "file",
    "size": "230.43 KB",
    "modified": "2025-07-18T05:16:19.562048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "dceb8992-af5f-4421-adf8-c00f950150ad",
    "name": "Ввод зазем.png",
    "type": "file",
    "size": "40.56 KB",
    "modified": "2025-07-18T05:16:19.590048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/Ввод зазем.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "98864254-2182-4eb9-a573-e06493ce8428",
    "name": "7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "type": "file",
    "size": "196.91 KB",
    "modified": "2025-07-18T05:16:19.548048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "b07f212c-e8c5-4def-b7dd-a0b077e126d0",
    "name": "7886-3-EOM_10_Pl_osv_A1.dwg",
    "type": "file",
    "size": "779.00 KB",
    "modified": "2025-07-18T05:16:19.540047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_10_Pl_osv_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "2456d40a-54a9-4b9d-bff8-75caca2bf1f6",
    "name": "7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "type": "file",
    "size": "235.60 KB",
    "modified": "2025-07-18T05:16:19.563048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "1e56ab6b-a821-4f09-9ad6-e46f68d6d654",
    "name": "7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "type": "file",
    "size": "832.26 KB",
    "modified": "2025-07-18T05:16:19.578048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "12f01451-97cc-4a91-aaf2-0364eccab065",
    "name": "7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "type": "file",
    "size": "244.92 KB",
    "modified": "2025-07-18T05:16:19.560048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-3-EOM/DWG/7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0a66eb85-db06-451a-979f-c4fca3f45850"
  },
  {
    "id": "ae6dfe35-d4c9-4978-970b-6992cd86ad10",
    "name": "7886-4-EOM",
    "type": "folder",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:19.591048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-4-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "93b9abca-c250-475f-ac21-4b964c829cc2",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:19.593048Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-4-EOM/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ae6dfe35-d4c9-4978-970b-6992cd86ad10"
  },
  {
    "id": "999ace6b-b4ae-4e44-a421-7d6300e07dc4",
    "name": "7886-1.1-EOM_AN (для инфо)",
    "type": "folder",
    "size": "17.45 MB",
    "modified": "2025-07-18T05:16:19.259042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "dd5b3e1c-5b99-4eee-acc7-28e9ddee31bb",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "17.45 MB",
    "modified": "2025-07-18T05:16:19.278043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "999ace6b-b4ae-4e44-a421-7d6300e07dc4"
  },
  {
    "id": "ebe2d395-1bba-43a4-bb2f-2e7c6170bb11",
    "name": "7886-1.1-EOM_AN.pdf",
    "type": "file",
    "size": "12.15 MB",
    "modified": "2025-07-18T05:16:19.274043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/7886-1.1-EOM_AN/7886-1.1-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dd5b3e1c-5b99-4eee-acc7-28e9ddee31bb"
  },
  {
    "id": "dc926c83-cdb1-46a0-9a96-c5a9bf40e35e",
    "name": "DWG",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:19.283043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/7886-1.1-EOM_AN/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dd5b3e1c-5b99-4eee-acc7-28e9ddee31bb"
  },
  {
    "id": "e50f4a7e-5fd9-4b81-be5d-bbf0db3265bf",
    "name": "7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "type": "file",
    "size": "3.77 MB",
    "modified": "2025-07-18T05:16:19.287043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dc926c83-cdb1-46a0-9a96-c5a9bf40e35e"
  },
  {
    "id": "c5d476f3-24f7-4344-8078-357a0466ad84",
    "name": "7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "type": "file",
    "size": "1.54 MB",
    "modified": "2025-07-18T05:16:19.281043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN (для инфо)/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dc926c83-cdb1-46a0-9a96-c5a9bf40e35e"
  },
  {
    "id": "a53f439b-b299-4509-8d1a-41d9af6894fa",
    "name": "7886-5-EOM",
    "type": "folder",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:19.607049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-5-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "cb048aad-52ec-4fd2-8bbf-cf258bb90e03",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:19.609049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-5-EOM/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "a53f439b-b299-4509-8d1a-41d9af6894fa"
  },
  {
    "id": "ed0c4098-78ca-46e3-999d-d0d409066ba1",
    "name": "7886-2-EOM",
    "type": "folder",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:19.519047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-2-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "cad996e4-c96e-4339-ba46-fc6e00b05a68",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:19.521047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-2-EOM/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ed0c4098-78ca-46e3-999d-d0d409066ba1"
  },
  {
    "id": "c71d2f56-1d97-469d-8ab0-abcd0daca5bd",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "34.27 MB",
    "modified": "2025-07-18T05:16:19.306043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "ad35ce00-2491-4bd3-ae64-98a8b042fa86",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:19.302043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c71d2f56-1d97-469d-8ab0-abcd0daca5bd"
  },
  {
    "id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c",
    "name": "DWG",
    "type": "folder",
    "size": "24.94 MB",
    "modified": "2025-07-18T05:16:19.386045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c71d2f56-1d97-469d-8ab0-abcd0daca5bd"
  },
  {
    "id": "84113165-aea2-48d6-a836-778a815ae1b3",
    "name": "7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:19.377044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "63ff9a6c-0f5e-421c-b06a-c47f40a64a5b",
    "name": "7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.87 MB",
    "modified": "2025-07-18T05:16:19.355044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "d7e38cc1-07aa-4f89-844a-61e37f1bab6b",
    "name": "7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "type": "file",
    "size": "240.00 KB",
    "modified": "2025-07-18T05:16:19.312043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "14898e5c-52c6-48b9-8a5f-2daf48f18ca5",
    "name": "7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "type": "file",
    "size": "200.17 KB",
    "modified": "2025-07-18T05:16:19.324044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "547ca356-e0b8-48f8-a5af-08c141c94034",
    "name": "7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.92 MB",
    "modified": "2025-07-18T05:16:19.368044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "85f8514b-c2ff-42a4-9e82-1428d365b02a",
    "name": "7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "type": "file",
    "size": "266.39 KB",
    "modified": "2025-07-18T05:16:19.323043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "2550ed5e-a6f9-432b-8036-83b2e49c0771",
    "name": "7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "type": "file",
    "size": "219.57 KB",
    "modified": "2025-07-18T05:16:19.383044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "3666926f-a7f7-43ba-b9bb-0f48528ea6aa",
    "name": "7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "type": "file",
    "size": "144.42 KB",
    "modified": "2025-07-18T05:16:19.309043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "15fe811b-c588-4ffb-bdca-714b372e1e25",
    "name": "7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "type": "file",
    "size": "194.01 KB",
    "modified": "2025-07-18T05:16:19.318043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "96e75de5-911a-4f20-9a81-d0f51a42057d",
    "name": "7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "type": "file",
    "size": "308.20 KB",
    "modified": "2025-07-18T05:16:19.314043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "8ff1e528-d000-48af-a4c4-18483a4911e4",
    "name": "7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "type": "file",
    "size": "199.54 KB",
    "modified": "2025-07-18T05:16:19.333044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "e4bbf4ff-eb5e-4c3a-b5bb-f5412410b4f0",
    "name": "7886-1.2-ЭОМ1_SO.xls",
    "type": "file",
    "size": "1.10 MB",
    "modified": "2025-07-18T05:16:19.388045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "618b6624-3d06-4ce2-822c-1280c071ebff",
    "name": "7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "type": "file",
    "size": "272.06 KB",
    "modified": "2025-07-18T05:16:19.322043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "8a42bf20-8662-4cbb-ac8c-5498165a1398",
    "name": "7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "type": "file",
    "size": "189.51 KB",
    "modified": "2025-07-18T05:16:19.327044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "88eae436-0610-4a54-bca2-530dd109b4e1",
    "name": "7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "type": "file",
    "size": "95.76 KB",
    "modified": "2025-07-18T05:16:19.307043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "1146dad4-687a-48b9-9108-d69866e1bed7",
    "name": "7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:19.349044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "de1e63d5-ce98-4197-b585-1e89422943d4",
    "name": "7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.18 MB",
    "modified": "2025-07-18T05:16:19.359044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "448ca69d-e9e0-4db8-8933-c8f91c31008a",
    "name": "7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.14 MB",
    "modified": "2025-07-18T05:16:19.381044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "fb3fa27c-ab73-4072-8b28-54a06f3dde6d",
    "name": "7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "type": "file",
    "size": "303.52 KB",
    "modified": "2025-07-18T05:16:19.329044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "a07a452d-a6e5-4bbe-a2fc-b5daaae67221",
    "name": "7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.52 MB",
    "modified": "2025-07-18T05:16:19.339044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "34ba242f-09f9-406a-81b7-94b32b89fa26",
    "name": "7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:19.343044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "e27d676b-9669-499f-85f1-752246fd1980",
    "name": "7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "type": "file",
    "size": "190.28 KB",
    "modified": "2025-07-18T05:16:19.331043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "8b6d9d26-25dd-4700-98e1-c3a22af16cf3",
    "name": "7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "type": "file",
    "size": "261.34 KB",
    "modified": "2025-07-18T05:16:19.309043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "e860752d-b5c6-4a5f-a624-d089ac6e3933",
    "name": "7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "type": "file",
    "size": "330.04 KB",
    "modified": "2025-07-18T05:16:19.316043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "2d793031-0600-466d-8629-c01bef87c48a",
    "name": "7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "type": "file",
    "size": "210.26 KB",
    "modified": "2025-07-18T05:16:19.319043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "0f5194dc-841c-4f80-8c6c-e0fc081ffd5c",
    "name": "7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "type": "file",
    "size": "238.39 KB",
    "modified": "2025-07-18T05:16:19.385045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "22845903-96ac-4f10-8225-c1990ff778ca",
    "name": "7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "type": "file",
    "size": "861.42 KB",
    "modified": "2025-07-18T05:16:19.362044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "a7cc24c8-7e70-49a2-836f-6568ee08af99",
    "name": "7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "type": "file",
    "size": "206.33 KB",
    "modified": "2025-07-18T05:16:19.311043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "00e088ba-3425-4589-b343-d61ee3739f35",
    "name": "7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "type": "file",
    "size": "199.62 KB",
    "modified": "2025-07-18T05:16:19.320043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "39e496f2-b247-4963-85af-228d47e74e30",
    "name": "7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "type": "file",
    "size": "212.64 KB",
    "modified": "2025-07-18T05:16:19.335044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "d59d166b-755c-447a-8ef4-1a45ce735290",
    "name": "7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.46 MB",
    "modified": "2025-07-18T05:16:19.372044Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "02eb28e8-df6b-42ca-8df7-1e71819d4633",
    "name": "7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "type": "file",
    "size": "386.10 KB",
    "modified": "2025-07-18T05:16:19.325043Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4f26acd2-9fdd-4dde-9b03-d9cca17abf4c"
  },
  {
    "id": "cd1b2bf8-02bd-44ca-860b-75c684505670",
    "name": "7886-7-EOM",
    "type": "folder",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:19.613049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-7-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "4e696f9d-68ea-43c3-99b7-b61673917b2c",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:19.618049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-7-EOM/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cd1b2bf8-02bd-44ca-860b-75c684505670"
  },
  {
    "id": "61a99de9-d103-4b1b-9dbf-299fdd9c66d9",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "17.45 MB",
    "modified": "2025-07-18T05:16:19.217041Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "6c51924b-552f-46e5-b4d6-580192fcd7b3",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "17.45 MB",
    "modified": "2025-07-18T05:16:19.243042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61a99de9-d103-4b1b-9dbf-299fdd9c66d9"
  },
  {
    "id": "b7f56146-a6e9-43be-874e-c5b19d2cdf39",
    "name": "7886-1.1-EOM_AN.pdf",
    "type": "file",
    "size": "12.15 MB",
    "modified": "2025-07-18T05:16:19.235042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/7886-1.1-EOM_AN/7886-1.1-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c51924b-552f-46e5-b4d6-580192fcd7b3"
  },
  {
    "id": "bd1da241-3c18-434b-84f9-5cd242db5ef7",
    "name": "DWG",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:19.249042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6c51924b-552f-46e5-b4d6-580192fcd7b3"
  },
  {
    "id": "50d55379-b6fc-4dc8-958b-2bee25652c3d",
    "name": "7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "type": "file",
    "size": "3.77 MB",
    "modified": "2025-07-18T05:16:19.254042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bd1da241-3c18-434b-84f9-5cd242db5ef7"
  },
  {
    "id": "419df563-606e-477f-b2db-1b9ed6772380",
    "name": "7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "type": "file",
    "size": "1.54 MB",
    "modified": "2025-07-18T05:16:19.247042Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bd1da241-3c18-434b-84f9-5cd242db5ef7"
  },
  {
    "id": "6a4bc7ce-a4f3-4e40-997e-41672ed701ea",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "28.88 MB",
    "modified": "2025-07-18T05:16:19.405045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "938d77bc-48e4-4178-886b-43527af220a5",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:19.401045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6a4bc7ce-a4f3-4e40-997e-41672ed701ea"
  },
  {
    "id": "3e4d2073-a087-48f3-adc6-568967070dba",
    "name": "DWG",
    "type": "folder",
    "size": "17.47 MB",
    "modified": "2025-07-18T05:16:19.470046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6a4bc7ce-a4f3-4e40-997e-41672ed701ea"
  },
  {
    "id": "cd81b902-332e-413f-9926-81e74667da94",
    "name": "7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "type": "file",
    "size": "1.04 MB",
    "modified": "2025-07-18T05:16:19.440046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "966c643e-de30-450a-b7d5-75ee9e0eef95",
    "name": "7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "type": "file",
    "size": "1.93 MB",
    "modified": "2025-07-18T05:16:19.436045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "12152001-90f2-4cf9-b160-bbf351aaa64f",
    "name": "7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "type": "file",
    "size": "1.42 MB",
    "modified": "2025-07-18T05:16:19.432045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "84166e61-06e1-4157-bc53-82afe0559207",
    "name": "7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "type": "file",
    "size": "293.25 KB",
    "modified": "2025-07-18T05:16:19.459046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "a70d6d1d-cecc-44c5-ad18-6795c33c66a8",
    "name": "7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "type": "file",
    "size": "640.98 KB",
    "modified": "2025-07-18T05:16:19.412045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "e11607e7-51f2-4602-bbaf-d17174387d4c",
    "name": "7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "type": "file",
    "size": "268.36 KB",
    "modified": "2025-07-18T05:16:19.468046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "76754c2a-ead4-4360-b3ca-c16cace060b8",
    "name": "7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "type": "file",
    "size": "624.10 KB",
    "modified": "2025-07-18T05:16:19.413045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "1c3524a1-991f-4046-8f6c-3bf123034ebb",
    "name": "7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "type": "file",
    "size": "474.39 KB",
    "modified": "2025-07-18T05:16:19.420045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "7b8df5ea-938e-4600-aad6-81c0d7acbbaa",
    "name": "7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "type": "file",
    "size": "695.24 KB",
    "modified": "2025-07-18T05:16:19.417045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "4b6adf5f-06df-4481-b38b-88d8d4e6624e",
    "name": "7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "type": "file",
    "size": "275.42 KB",
    "modified": "2025-07-18T05:16:19.454046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "2bca7ec1-2c42-4845-b5cf-1b04a7169f64",
    "name": "7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "type": "file",
    "size": "339.44 KB",
    "modified": "2025-07-18T05:16:19.469046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "2dd4c81c-cab3-4698-8e92-7660ea200b00",
    "name": "7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "type": "file",
    "size": "323.82 KB",
    "modified": "2025-07-18T05:16:19.410045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "da5b216c-4473-4f2b-81fa-38038c67eb11",
    "name": "7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "type": "file",
    "size": "301.94 KB",
    "modified": "2025-07-18T05:16:19.415045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "8aa24dfa-742c-4747-ad10-39ec7e8f9d5c",
    "name": "7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "type": "file",
    "size": "253.55 KB",
    "modified": "2025-07-18T05:16:19.409045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "dcfd68fe-f73e-4f15-8f41-a0c3d1668a9e",
    "name": "7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "type": "file",
    "size": "563.29 KB",
    "modified": "2025-07-18T05:16:19.418045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "93fecd31-51d1-49b5-8cde-cc6e73ca9366",
    "name": "7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "type": "file",
    "size": "231.74 KB",
    "modified": "2025-07-18T05:16:19.456046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "d8dd0b74-043d-4060-bb4f-ab2a7ef9b8d0",
    "name": "7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "type": "file",
    "size": "1.65 MB",
    "modified": "2025-07-18T05:16:19.428045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "0f4bd800-7e40-455d-b464-c42da4072a46",
    "name": "7886-1.3-ЭОМ_CO.xls",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:19.471046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-ЭОМ_CO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "b042a9ff-82a2-4bfe-aeac-84ebc6eb5d9a",
    "name": "7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "type": "file",
    "size": "340.96 KB",
    "modified": "2025-07-18T05:16:19.421045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "e2b0ee73-7462-44d4-be8e-5a9573a2121c",
    "name": "7886-1.3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "273.11 KB",
    "modified": "2025-07-18T05:16:19.424045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "3f8b789f-c6fa-4f5b-8c37-94a62c50ac08",
    "name": "7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.06 KB",
    "modified": "2025-07-18T05:16:19.406045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "b6f5a79e-3b35-4cc2-9fb0-394f7d2e1d74",
    "name": "7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "type": "file",
    "size": "466.61 KB",
    "modified": "2025-07-18T05:16:19.423045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "fc112446-5827-4b7f-ac09-7c65467676ed",
    "name": "7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "type": "file",
    "size": "354.95 KB",
    "modified": "2025-07-18T05:16:19.461046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "247f61d8-8a71-4f83-91cb-6c5679dbcfea",
    "name": "7886-1.3-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "88.84 KB",
    "modified": "2025-07-18T05:16:19.408045Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "3c41d343-7a4d-4cc0-b3b9-7a07e23eb0a2",
    "name": "7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "type": "file",
    "size": "304.33 KB",
    "modified": "2025-07-18T05:16:19.462046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "bd04619a-075b-4287-b094-061da8f3338d",
    "name": "7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "type": "file",
    "size": "377.08 KB",
    "modified": "2025-07-18T05:16:19.467046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "fa806822-429b-42b5-816d-cf986b7b20ad",
    "name": "7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "type": "file",
    "size": "2.01 MB",
    "modified": "2025-07-18T05:16:19.445046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "da11873e-4b40-4897-9294-e3be8c0d2529",
    "name": "7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "type": "file",
    "size": "323.02 KB",
    "modified": "2025-07-18T05:16:19.465046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "108c76d1-61f8-4cdb-8311-155eb4d6b310",
    "name": "7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "type": "file",
    "size": "190.98 KB",
    "modified": "2025-07-18T05:16:19.458046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "7cffa808-e620-4e5a-94dc-769531887efa",
    "name": "7886-1.3-EOM_25_SUP_A2.dwg",
    "type": "file",
    "size": "334.59 KB",
    "modified": "2025-07-18T05:16:19.450046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-1.3-EOM/DWG/7886-1.3-EOM_25_SUP_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3e4d2073-a087-48f3-adc6-568967070dba"
  },
  {
    "id": "7e51735c-4a63-4cbd-8617-a9830918900a",
    "name": "EOM-ЭОМ-Электрооборудование 16-04-2025",
    "type": "folder",
    "size": "249.05 MB",
    "modified": "2025-07-18T05:16:20.259061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "8f936b4b-6852-43f7-864d-8334b237f6c4",
    "name": "7886-8.1-EOM",
    "type": "folder",
    "size": "29.44 MB",
    "modified": "2025-07-18T05:16:20.264061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "de383a7f-cda9-44a8-aac6-c9bba8504de6",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "1.99 MB",
    "modified": "2025-07-18T05:16:20.262061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8f936b4b-6852-43f7-864d-8334b237f6c4"
  },
  {
    "id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a",
    "name": "DWG",
    "type": "folder",
    "size": "27.45 MB",
    "modified": "2025-07-18T05:16:20.316062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8f936b4b-6852-43f7-864d-8334b237f6c4"
  },
  {
    "id": "b7368ec3-c0c4-485c-b22f-7e88907b32c8",
    "name": "7886-8.1-EOM_Oblozhka_A2.dwg",
    "type": "file",
    "size": "82.89 KB",
    "modified": "2025-07-18T05:16:20.314062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "90956487-71f3-46d5-bd7f-a2813feacf96",
    "name": "7886-8.1-EOM_10-11_Moln_Vvod_A3.dwg",
    "type": "file",
    "size": "2.74 MB",
    "modified": "2025-07-18T05:16:20.310061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_10-11_Moln_Vvod_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "d0d0e7e0-5348-445c-90ed-86d8b04beb47",
    "name": "7886-8.1-EOM_03-04_Sh_VRU8.1-DGU_A2.dwg",
    "type": "file",
    "size": "317.04 KB",
    "modified": "2025-07-18T05:16:20.268061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_03-04_Sh_VRU8.1-DGU_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "beb08592-ed9a-43fc-9eac-8273e120a28a",
    "name": "7886-8.1-EOM_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.16 KB",
    "modified": "2025-07-18T05:16:20.313062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "fc996df7-957d-4f2f-9a3a-7e22f6a6fbaf",
    "name": "7886-8.1-EOM_08_osv_A2.dwg",
    "type": "file",
    "size": "528.44 KB",
    "modified": "2025-07-18T05:16:20.277061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_08_osv_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "0c734d2c-7e39-48cc-9fb8-07f3389cbce3",
    "name": "7886-8.1-EOM_01_Obdan_A3.dwg",
    "type": "file",
    "size": "196.35 KB",
    "modified": "2025-07-18T05:16:20.266061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_01_Obdan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "b5539dda-db78-4d97-b286-c94e478a593a",
    "name": "7886-8.1-EOM_05_Shema SHR_A2.dwg",
    "type": "file",
    "size": "259.11 KB",
    "modified": "2025-07-18T05:16:20.271061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_05_Shema SHR_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "d521d7b0-02dd-420c-a32d-3de3166f6c8b",
    "name": "7886-8.1-EOM_Titulniy_A1.dwg",
    "type": "file",
    "size": "85.44 KB",
    "modified": "2025-07-18T05:16:20.315062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "8d429873-46b1-4714-9463-83ff9b16ee8a",
    "name": "7886-8.1-EOM_09_uzly_A2.dwg",
    "type": "file",
    "size": "22.38 MB",
    "modified": "2025-07-18T05:16:20.299061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_09_uzly_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "85e8a06e-705c-4192-98fb-18da3ab7bdd6",
    "name": "7886-8.1-EOM_02_Obdan_A4.dwg",
    "type": "file",
    "size": "180.62 KB",
    "modified": "2025-07-18T05:16:20.267061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_02_Obdan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "aa956e33-8ecc-4d59-896e-c91c1a9f90b3",
    "name": "7886-8.1-EOM_07_SIlov_A2.dwg",
    "type": "file",
    "size": "357.07 KB",
    "modified": "2025-07-18T05:16:20.275061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_07_SIlov_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "8983327a-af78-4c38-bc35-071f4f178fd3",
    "name": "7886-8.1-EOM_Titulniy_A2.dwg",
    "type": "file",
    "size": "82.67 KB",
    "modified": "2025-07-18T05:16:20.316062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "af786280-ab39-417c-b6a6-c98af8804612",
    "name": "7886-8.1-EOM_06_Shema SHV-1_A2.dwg",
    "type": "file",
    "size": "217.92 KB",
    "modified": "2025-07-18T05:16:20.273061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-8.1-EOM/DWG/7886-8.1-EOM_06_Shema SHV-1_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "01b122d2-dcfd-49f1-9e63-2e4a07fba99a"
  },
  {
    "id": "9c496c95-a7f9-4c27-a372-cf97a27e6977",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "23.36 MB",
    "modified": "2025-07-18T05:16:19.996056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "72bce917-8d18-4acb-b73c-0bc48a2c7e3b",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "23.36 MB",
    "modified": "2025-07-18T05:16:20.022056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9c496c95-a7f9-4c27-a372-cf97a27e6977"
  },
  {
    "id": "8db99a74-d613-438b-9dd8-021cc180fd07",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:20.005056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "72bce917-8d18-4acb-b73c-0bc48a2c7e3b"
  },
  {
    "id": "0eb6299c-01fc-45b5-b3d9-60b08c23e484",
    "name": "7886-3-EOM_AN.pdf",
    "type": "file",
    "size": "6.07 MB",
    "modified": "2025-07-18T05:16:20.017056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/7886-3-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "72bce917-8d18-4acb-b73c-0bc48a2c7e3b"
  },
  {
    "id": "fd612a6a-cb86-4bd0-b715-caa15deba344",
    "name": "DWG",
    "type": "folder",
    "size": "11.12 MB",
    "modified": "2025-07-18T05:16:20.102058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "72bce917-8d18-4acb-b73c-0bc48a2c7e3b"
  },
  {
    "id": "4c2952c8-8473-4d62-a00b-200d8ca28565",
    "name": "7886-3-ЭОМ_SO.xls",
    "type": "file",
    "size": "1.05 MB",
    "modified": "2025-07-18T05:16:20.077057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-ЭОМ_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "fb9be3bd-ef13-4729-bdd5-671e0aa9c0ad",
    "name": "7886-3-EOM_12_Pl_urav_A3.dwg",
    "type": "file",
    "size": "313.65 KB",
    "modified": "2025-07-18T05:16:20.038057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_12_Pl_urav_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "1b6b1589-98f8-45bd-a5c5-a4f64796272a",
    "name": "7886-3-EOM_15_Pl_TE_A1.dwg",
    "type": "file",
    "size": "3.06 MB",
    "modified": "2025-07-18T05:16:20.053057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_15_Pl_TE_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "2f3b9d8e-2eba-4f41-a972-1cdc8adaa450",
    "name": "7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "type": "file",
    "size": "281.27 KB",
    "modified": "2025-07-18T05:16:20.058057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_16_Sh_A2_А3х4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "e481f85e-2a94-4868-9faf-fa2aa5a60daf",
    "name": "7886-3_0_Titulniy_A2.dwg",
    "type": "file",
    "size": "92.42 KB",
    "modified": "2025-07-18T05:16:20.100058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3_0_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "6268f976-ebff-4e84-9bcd-9d6befd20cdf",
    "name": "7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "type": "file",
    "size": "241.92 KB",
    "modified": "2025-07-18T05:16:20.066057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_5_Sh_SHR1_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "0950c134-b956-4506-a14e-29601f76460e",
    "name": "7886-3-EOM_8_Pl_sila_A1.dwg",
    "type": "file",
    "size": "842.39 KB",
    "modified": "2025-07-18T05:16:20.072057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_8_Pl_sila_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "25882e32-aec8-45df-929a-dbd336abcf8c",
    "name": "7886-3_0_Oblozhka_A2.dwg",
    "type": "file",
    "size": "90.47 KB",
    "modified": "2025-07-18T05:16:20.088058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3_0_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "66bbbd04-442b-43ab-9bc6-9ec15cecade4",
    "name": "2.png",
    "type": "file",
    "size": "108.11 KB",
    "modified": "2025-07-18T05:16:20.023056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/2.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "ff381af0-0d0e-4918-99e1-16ab299e4217",
    "name": "1.png",
    "type": "file",
    "size": "37.75 KB",
    "modified": "2025-07-18T05:16:20.023056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/1.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "317f6ef5-7e4c-4eb6-8024-034a9baf1a3e",
    "name": "7886-3-EOM_11_Pl_zaz_A1.dwg",
    "type": "file",
    "size": "1.44 MB",
    "modified": "2025-07-18T05:16:20.029056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_11_Pl_zaz_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "d679b923-2198-4423-ad76-6e8407df2fda",
    "name": "7886-3-EOM_13_Pl_lot_A1.dwg",
    "type": "file",
    "size": "398.55 KB",
    "modified": "2025-07-18T05:16:20.042057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_13_Pl_lot_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "7cb4f844-b37a-4df2-ba16-8ef5e8321446",
    "name": "7886-3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "231.10 KB",
    "modified": "2025-07-18T05:16:20.059057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "2240bcc3-db0a-418f-ab7c-59f2c5c6ad31",
    "name": "7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "type": "file",
    "size": "291.62 KB",
    "modified": "2025-07-18T05:16:20.068057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_7_Sh_SHO1_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "c7e0b60d-3721-4fdc-bc76-1e00b96ca75f",
    "name": "7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "type": "file",
    "size": "213.23 KB",
    "modified": "2025-07-18T05:16:20.067057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_6_Sh_SHR2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "5f0efdd1-a9b6-47cd-a025-38e838a024d5",
    "name": "7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "type": "file",
    "size": "230.43 KB",
    "modified": "2025-07-18T05:16:20.063057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_3_Sh_SHPPU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "a27fa76f-428c-4701-8c22-a63fde3ab5a2",
    "name": "Ввод зазем.png",
    "type": "file",
    "size": "40.56 KB",
    "modified": "2025-07-18T05:16:20.102058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/Ввод зазем.png",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "6314d30f-87dc-4d30-bbd4-9f45d764a1c5",
    "name": "7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "type": "file",
    "size": "196.91 KB",
    "modified": "2025-07-18T05:16:20.048057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_14_Pl_Sh_DGU_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "782f2c32-5aab-4bdc-881a-9db7a996716f",
    "name": "7886-3-EOM_10_Pl_osv_A1.dwg",
    "type": "file",
    "size": "779.00 KB",
    "modified": "2025-07-18T05:16:20.025056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_10_Pl_osv_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "31863789-1c63-4550-b4ee-7bbe1fedcda6",
    "name": "7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "type": "file",
    "size": "235.60 KB",
    "modified": "2025-07-18T05:16:20.065057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_4_Sh_VRU-DGU_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "419e810a-375d-4937-9cda-1fb0dc75c6e4",
    "name": "7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "type": "file",
    "size": "832.26 KB",
    "modified": "2025-07-18T05:16:20.074057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_9_Pl_sila_krov_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "8e86b398-d111-43f9-9855-303a7db84754",
    "name": "7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "type": "file",
    "size": "244.92 KB",
    "modified": "2025-07-18T05:16:20.062057Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-3-EOM/7886-3-EOM/DWG/7886-3-EOM_2_Sh_VRU3_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd612a6a-cb86-4bd0-b715-caa15deba344"
  },
  {
    "id": "5faeb26b-94f5-4798-8ac4-a3f5b59f5e3e",
    "name": "7886-4-EOM",
    "type": "folder",
    "size": "7.74 MB",
    "modified": "2025-07-18T05:16:20.110058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "c9e7110c-27d5-451a-9f28-82a7d6d9f19a",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:20.108058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5faeb26b-94f5-4798-8ac4-a3f5b59f5e3e"
  },
  {
    "id": "aece0797-c5e6-416b-a4b0-73b97ebd0922",
    "name": "DWG",
    "type": "folder",
    "size": "5.83 MB",
    "modified": "2025-07-18T05:16:20.134058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5faeb26b-94f5-4798-8ac4-a3f5b59f5e3e"
  },
  {
    "id": "4b1ad4ec-e464-41dd-9988-daba8913f680",
    "name": "7886-4-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "86.72 KB",
    "modified": "2025-07-18T05:16:20.115058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "2a354614-af9a-4727-9b67-345eebc773cc",
    "name": "7886-4-EOM_05_sila_pl_0,000_А4x3.dwg",
    "type": "file",
    "size": "881.26 KB",
    "modified": "2025-07-18T05:16:20.123058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_05_sila_pl_0,000_А4x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "7766fc41-da81-4861-bd17-8c6548c9fb0e",
    "name": "7886-4-EOM_07_uzly lotkov_pl_А3.dwg",
    "type": "file",
    "size": "841.65 KB",
    "modified": "2025-07-18T05:16:20.129058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_07_uzly lotkov_pl_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "e8624209-8aa6-4fb2-a764-f3979f27f0c8",
    "name": "7886-4-EOM_08_molniez_zazem_pl_А2.dwg",
    "type": "file",
    "size": "577.28 KB",
    "modified": "2025-07-18T05:16:20.132058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_08_molniez_zazem_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "f1c84273-d9b5-4b6e-ae32-98af8208f754",
    "name": "7886-4-EOM.SO.xls",
    "type": "file",
    "size": "1.07 MB",
    "modified": "2025-07-18T05:16:20.112058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "1dffc52f-d90b-4b37-9e62-e5c0f88e6586",
    "name": "7886-4-EOM_03.2_sh_ppu-kpp1_А3.dwg",
    "type": "file",
    "size": "321.87 KB",
    "modified": "2025-07-18T05:16:20.120058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_03.2_sh_ppu-kpp1_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "d2a79f44-a89f-4853-9cf7-e84ccb8e50ce",
    "name": "7886-4-EOM_03.1_sh_vru4_А1.dwg",
    "type": "file",
    "size": "327.80 KB",
    "modified": "2025-07-18T05:16:20.119058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_03.1_sh_vru4_А1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "9db0b8e7-2430-4e7a-b4b0-6570dd1b583d",
    "name": "7886-4-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.31 KB",
    "modified": "2025-07-18T05:16:20.114058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "1e5a682d-a3a0-4e98-a1db-6ab2d829480d",
    "name": "7886-4-EOM_09_vvod_pl_0,000_А3.dwg",
    "type": "file",
    "size": "419.59 KB",
    "modified": "2025-07-18T05:16:20.134058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_09_vvod_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "3edf1f66-1330-43dc-ac34-3d7288c204bd",
    "name": "7886-4-EOM_04_sh_shuv_А4.dwg",
    "type": "file",
    "size": "348.73 KB",
    "modified": "2025-07-18T05:16:20.121058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_04_sh_shuv_А4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "a072df24-e480-4733-b491-ac08c55a022d",
    "name": "7886-4-EOM_06_osv_pl_0,000_А3.dwg",
    "type": "file",
    "size": "468.75 KB",
    "modified": "2025-07-18T05:16:20.126058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_06_osv_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "c4841d5f-3aca-44c2-be13-f534a583d4fc",
    "name": "7886-4-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "291.30 KB",
    "modified": "2025-07-18T05:16:20.117058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "a70f4f7b-11b0-4a38-ac7c-89126a7dc7d6",
    "name": "7886-4-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "222.34 KB",
    "modified": "2025-07-18T05:16:20.118058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-4-EOM/DWG/7886-4-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "aece0797-c5e6-416b-a4b0-73b97ebd0922"
  },
  {
    "id": "6bb649bf-4475-4755-98fe-4a229e4b7a0f",
    "name": "7886-5-EOM",
    "type": "folder",
    "size": "28.38 MB",
    "modified": "2025-07-18T05:16:20.141058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "af2ec5a4-fda9-4c7a-bbde-0466f7b9565c",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:20.139058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6bb649bf-4475-4755-98fe-4a229e4b7a0f"
  },
  {
    "id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a",
    "name": "DWG",
    "type": "folder",
    "size": "26.48 MB",
    "modified": "2025-07-18T05:16:20.196059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6bb649bf-4475-4755-98fe-4a229e4b7a0f"
  },
  {
    "id": "97401203-216c-4406-b980-b6cba986ee83",
    "name": "7886-5-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "220.25 KB",
    "modified": "2025-07-18T05:16:20.150059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "442fdb2d-93f4-453a-94d2-49e04d282592",
    "name": "7886-5-EOM_06_osv_pl_0,000_А2.dwg",
    "type": "file",
    "size": "406.21 KB",
    "modified": "2025-07-18T05:16:20.159059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_06_osv_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "9f740384-fe74-4027-9d52-9f4eac4121ab",
    "name": "7886-5-EOM_03.2_sh_PPU-KPP2_А3.dwg",
    "type": "file",
    "size": "341.32 KB",
    "modified": "2025-07-18T05:16:20.152059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_03.2_sh_PPU-KPP2_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "47bf0b18-aef2-4aac-bdde-8530b9846ab1",
    "name": "7886-5-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "86.69 KB",
    "modified": "2025-07-18T05:16:20.147058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "516a938d-c425-4754-b192-9f835966a934",
    "name": "7886-5-EOM.SO.xls",
    "type": "file",
    "size": "1.08 MB",
    "modified": "2025-07-18T05:16:20.144058Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "d273a740-94db-4ee0-8d66-25a5b68f6a17",
    "name": "7886-5-EOM_09_vvod_pl_0,000_А3.dwg",
    "type": "file",
    "size": "664.75 KB",
    "modified": "2025-07-18T05:16:20.197059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_09_vvod_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "02bb5542-18d5-43f1-affc-0909026add64",
    "name": "7886-5-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.25 KB",
    "modified": "2025-07-18T05:16:20.146059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "2034ab61-d32e-4178-bd03-9a22b1d169bf",
    "name": "7886-5-EOM_07_uzly lotkov_pl_А3.dwg",
    "type": "file",
    "size": "21.39 MB",
    "modified": "2025-07-18T05:16:20.185059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_07_uzly lotkov_pl_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "84d1c9b7-4eda-409a-9b00-1e87dcae24d6",
    "name": "7886-5-EOM_04_sh_SHUV_А4.dwg",
    "type": "file",
    "size": "358.64 KB",
    "modified": "2025-07-18T05:16:20.155059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_04_sh_SHUV_А4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "4b318af6-5afe-476a-977f-26cf9357bca9",
    "name": "7886-5-EOM_03_1_sh_VRU5_А4х4.dwg",
    "type": "file",
    "size": "359.30 KB",
    "modified": "2025-07-18T05:16:20.153059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_03_1_sh_VRU5_А4х4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "943dec54-a857-41b7-88e4-6c905eb13fee",
    "name": "7886-5-EOM_05_sila_pl_0,000_А3x3.dwg",
    "type": "file",
    "size": "711.51 KB",
    "modified": "2025-07-18T05:16:20.157059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_05_sila_pl_0,000_А3x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "1f4be1c4-6284-4062-9edf-20c0bea061e3",
    "name": "7886-5-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "315.82 KB",
    "modified": "2025-07-18T05:16:20.149059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "90562d06-52ef-4e2b-bd42-f31482e2d6ce",
    "name": "7886-5-EOM_08_molniez_zazem_pl_А3x3.dwg",
    "type": "file",
    "size": "561.54 KB",
    "modified": "2025-07-18T05:16:20.194059Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-5-EOM/DWG/7886-5-EOM_08_molniez_zazem_pl_А3x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bdcf5e23-c769-4e40-aa31-4b442ddc8e7a"
  },
  {
    "id": "4d50708a-e2ed-4293-91cb-cfe361dad13c",
    "name": "7886-2-EOM",
    "type": "folder",
    "size": "2.92 MB",
    "modified": "2025-07-18T05:16:19.963055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "fc879ad1-5494-4197-b4f9-d7c7c6d543b8",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:19.943055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4d50708a-e2ed-4293-91cb-cfe361dad13c"
  },
  {
    "id": "e803837f-d777-4f0d-ba43-62aaadfb494c",
    "name": "DWG",
    "type": "folder",
    "size": "2.03 MB",
    "modified": "2025-07-18T05:16:19.989056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4d50708a-e2ed-4293-91cb-cfe361dad13c"
  },
  {
    "id": "d63fc14e-3be0-4ed5-8a4a-d358f178c125",
    "name": "7886-2-EOM_03_plany osv sil zaz.dwg",
    "type": "file",
    "size": "311.30 KB",
    "modified": "2025-07-18T05:16:19.986056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM_03_plany osv sil zaz.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "f4ce422a-6b4c-4545-a879-46e100eef274",
    "name": "7886-2-EOM_Titulniy.dwg",
    "type": "file",
    "size": "143.01 KB",
    "modified": "2025-07-18T05:16:19.989056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM_Titulniy.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "e0c8b897-b09e-4201-ab9e-7e5dfb707a85",
    "name": "7886-2-EOM_02_shema.dwg",
    "type": "file",
    "size": "202.91 KB",
    "modified": "2025-07-18T05:16:19.985056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM_02_shema.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "876a4a90-ebbf-4be2-bea1-b99fb11448d1",
    "name": "7886-2-EOM.SO.xls",
    "type": "file",
    "size": "1.04 MB",
    "modified": "2025-07-18T05:16:19.977056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "893bb279-c72b-46f1-b42e-07a9ee307240",
    "name": "7886-2-EOM_01_Obdan.dwg",
    "type": "file",
    "size": "276.13 KB",
    "modified": "2025-07-18T05:16:19.979055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM_01_Obdan.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "35f8d302-caba-4e5e-9834-25d56023657c",
    "name": "7886-2-EOM_Oblozhka.dwg",
    "type": "file",
    "size": "85.03 KB",
    "modified": "2025-07-18T05:16:19.988056Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-2-EOM/DWG/7886-2-EOM_Oblozhka.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e803837f-d777-4f0d-ba43-62aaadfb494c"
  },
  {
    "id": "0bff7648-87e2-4886-a5eb-eb88fcfb2bbb",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "45.13 MB",
    "modified": "2025-07-18T05:16:19.683050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "4728e22c-927a-4933-99df-b343cad540dc",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "45.13 MB",
    "modified": "2025-07-18T05:16:19.723051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0bff7648-87e2-4886-a5eb-eb88fcfb2bbb"
  },
  {
    "id": "5d80de6a-3c8e-4443-a267-75a89031e7e9",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:19.694050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4728e22c-927a-4933-99df-b343cad540dc"
  },
  {
    "id": "74127714-b112-4fbf-9aef-99361cc87d2b",
    "name": "7886-1.2-EOM1_AN.pdf",
    "type": "file",
    "size": "10.86 MB",
    "modified": "2025-07-18T05:16:19.718051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/7886-1.2-EOM1_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4728e22c-927a-4933-99df-b343cad540dc"
  },
  {
    "id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596",
    "name": "DWG",
    "type": "folder",
    "size": "24.94 MB",
    "modified": "2025-07-18T05:16:19.802052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4728e22c-927a-4933-99df-b343cad540dc"
  },
  {
    "id": "c8ac70f9-4614-44bf-83ee-abb067ee7576",
    "name": "7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:19.794052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "06158400-3041-4d8e-b625-bc78873aefb6",
    "name": "7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.87 MB",
    "modified": "2025-07-18T05:16:19.771052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "06ee7090-6a75-47fa-ae9b-2f5ef8d52695",
    "name": "7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "type": "file",
    "size": "240.00 KB",
    "modified": "2025-07-18T05:16:19.731051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "b5caed18-fade-47ac-8dbf-4ce9a155432c",
    "name": "7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "type": "file",
    "size": "200.17 KB",
    "modified": "2025-07-18T05:16:19.745051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "2d98d2c6-58d5-498d-ab41-93270b6d10e9",
    "name": "7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.92 MB",
    "modified": "2025-07-18T05:16:19.784052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "319232ad-f599-4ae9-843e-6ba53db8afb1",
    "name": "7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "type": "file",
    "size": "266.39 KB",
    "modified": "2025-07-18T05:16:19.743051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "7a6855c0-834e-456f-91b9-421db2c0b147",
    "name": "7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "type": "file",
    "size": "219.57 KB",
    "modified": "2025-07-18T05:16:19.800052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "af16c552-5ae5-4b33-a987-1929a18a45ab",
    "name": "7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "type": "file",
    "size": "144.42 KB",
    "modified": "2025-07-18T05:16:19.726051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "d1c21409-5011-49cd-8f63-e30fb1928d27",
    "name": "7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "type": "file",
    "size": "194.01 KB",
    "modified": "2025-07-18T05:16:19.737051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "a21ebd87-29f3-48b5-abc5-88359a0a2a3e",
    "name": "7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "type": "file",
    "size": "308.20 KB",
    "modified": "2025-07-18T05:16:19.733051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "1102a9ca-c24b-45c9-8bc1-8af600ab71d2",
    "name": "7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "type": "file",
    "size": "199.54 KB",
    "modified": "2025-07-18T05:16:19.753051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "0686ca46-32c3-479d-8ef5-6603fec84c96",
    "name": "7886-1.2-ЭОМ1_SO.xls",
    "type": "file",
    "size": "1.10 MB",
    "modified": "2025-07-18T05:16:19.804052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "408f0ab2-7026-4dfd-9c37-bce429b6b9d6",
    "name": "7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "type": "file",
    "size": "272.06 KB",
    "modified": "2025-07-18T05:16:19.742051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "e9a84bae-6c71-4cc6-b7b1-2da908e05785",
    "name": "7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "type": "file",
    "size": "189.51 KB",
    "modified": "2025-07-18T05:16:19.749051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "e942f233-5480-4012-b32f-c8d310a6aa77",
    "name": "7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "type": "file",
    "size": "95.76 KB",
    "modified": "2025-07-18T05:16:19.724051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "e3438ea8-49bd-4a2b-83d8-9e2b54bb03d7",
    "name": "7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:19.765052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "f5e526a7-4a87-4fb3-a8b4-bbbda49955ae",
    "name": "7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.18 MB",
    "modified": "2025-07-18T05:16:19.775052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "be3b08f2-ee4e-4971-93ea-11deb50c0dbb",
    "name": "7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.14 MB",
    "modified": "2025-07-18T05:16:19.798052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "84bca01f-ef03-4867-9ae9-3aa44ff50193",
    "name": "7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "type": "file",
    "size": "303.52 KB",
    "modified": "2025-07-18T05:16:19.750051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "c60ee2fc-a6ed-486d-9ca4-b76d4eb481d7",
    "name": "7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.52 MB",
    "modified": "2025-07-18T05:16:19.757051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "9f01b2e2-259a-46f3-93c1-1a539d13eb2a",
    "name": "7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:19.761051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "6fa88511-0e68-48e2-9c98-ccb696457ce6",
    "name": "7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "type": "file",
    "size": "190.28 KB",
    "modified": "2025-07-18T05:16:19.751051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "47d79244-0c46-46e9-a47e-b4fcbde9ec44",
    "name": "7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "type": "file",
    "size": "261.34 KB",
    "modified": "2025-07-18T05:16:19.727051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "5dfe439a-9eab-4432-b8c5-a2fff103bcba",
    "name": "7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "type": "file",
    "size": "330.04 KB",
    "modified": "2025-07-18T05:16:19.735051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "680e0765-1c6e-4d43-a579-79473290e7af",
    "name": "7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "type": "file",
    "size": "210.26 KB",
    "modified": "2025-07-18T05:16:19.739051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "dc7d12b2-9f4e-4a2b-b355-a6940de5f2b3",
    "name": "7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "type": "file",
    "size": "238.39 KB",
    "modified": "2025-07-18T05:16:19.801052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "2bc264b5-dbc6-474e-8141-d964c41008d3",
    "name": "7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "type": "file",
    "size": "861.42 KB",
    "modified": "2025-07-18T05:16:19.779052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "796eae21-0ed1-4ff9-9cdd-2c5d1b2c5681",
    "name": "7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "type": "file",
    "size": "206.33 KB",
    "modified": "2025-07-18T05:16:19.729051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "315e10b2-341d-4cc6-8423-d44fa45cf212",
    "name": "7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "type": "file",
    "size": "199.62 KB",
    "modified": "2025-07-18T05:16:19.740051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "99b9535a-2746-4375-b092-55b16593c52c",
    "name": "7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "type": "file",
    "size": "212.64 KB",
    "modified": "2025-07-18T05:16:19.754051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "38224175-2ea7-4864-830c-1c9ddc3f6c5a",
    "name": "7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.46 MB",
    "modified": "2025-07-18T05:16:19.790052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "f1c2395c-fe53-4029-9108-5b7c1137fef9",
    "name": "7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "type": "file",
    "size": "386.10 KB",
    "modified": "2025-07-18T05:16:19.747051Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bc6e8c0c-e3a5-4e67-bfdf-20da16e8f596"
  },
  {
    "id": "583b182a-3bea-4287-ace0-b097e66764ca",
    "name": "7886-7-EOM",
    "type": "folder",
    "size": "29.34 MB",
    "modified": "2025-07-18T05:16:20.203060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "2d0cd259-f002-4807-b436-bc85e4ffbb1b",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.201060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "583b182a-3bea-4287-ace0-b097e66764ca"
  },
  {
    "id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825",
    "name": "DWG",
    "type": "folder",
    "size": "26.66 MB",
    "modified": "2025-07-18T05:16:20.257061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "583b182a-3bea-4287-ace0-b097e66764ca"
  },
  {
    "id": "ca3cf178-7d36-4adb-8891-f792da3978e1",
    "name": "7886-7-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "177.37 KB",
    "modified": "2025-07-18T05:16:20.208060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "3e36d550-50a9-4439-9868-eedba72d0523",
    "name": "7886-7-EOM_03_sh_VRU7_А2.dwg",
    "type": "file",
    "size": "281.93 KB",
    "modified": "2025-07-18T05:16:20.209060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_03_sh_VRU7_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "0e034441-14e8-4118-b31e-2b65897be701",
    "name": "7886-7-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "203.28 KB",
    "modified": "2025-07-18T05:16:20.207060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "cfd4c6f7-8c88-493e-a2a5-665fab25940a",
    "name": "7886-7-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "85.41 KB",
    "modified": "2025-07-18T05:16:20.206060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "0bfa9185-e3a7-4311-9535-eb0c539ad640",
    "name": "7886-7-EOM_08_molniez_zazem_pl_А2.dwg",
    "type": "file",
    "size": "2.93 MB",
    "modified": "2025-07-18T05:16:20.254061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_08_molniez_zazem_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "fa192a8e-6a35-4ff8-bf38-909fde5bd2b2",
    "name": "7886-7-EOM_07_uzly lotkov_pl_А2.dwg",
    "type": "file",
    "size": "21.61 MB",
    "modified": "2025-07-18T05:16:20.242060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_07_uzly lotkov_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "a5dbf285-552a-41d0-97ae-74aee4303b0c",
    "name": "7886-7-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.57 KB",
    "modified": "2025-07-18T05:16:20.205060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "958f33f1-697a-4948-ae1c-3ff21997b2b4",
    "name": "7886-7-EOM_06_osv_pl_0,000_А2.dwg",
    "type": "file",
    "size": "306.07 KB",
    "modified": "2025-07-18T05:16:20.214060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_06_osv_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "fecea03d-0240-45e6-b38f-1ba423453aa6",
    "name": "7886-7-EOM_09_Vvod_pl_0,000_А2.dwg",
    "type": "file",
    "size": "464.92 KB",
    "modified": "2025-07-18T05:16:20.258061Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_09_Vvod_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "9e3160e2-26b0-407f-b620-897cf665b125",
    "name": "7886-7-EOM_05_sila_pl_0,000_А2.dwg",
    "type": "file",
    "size": "314.13 KB",
    "modified": "2025-07-18T05:16:20.213060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_05_sila_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "a20e4dd5-bbe9-4840-9645-9b2fe523c398",
    "name": "7886-7-EOM_04_sh_SHPPU7_А3.dwg",
    "type": "file",
    "size": "257.78 KB",
    "modified": "2025-07-18T05:16:20.211060Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-7-EOM/DWG/7886-7-EOM_04_sh_SHPPU7_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "45c0ec1d-9a34-4819-95eb-4ac4ad6e4825"
  },
  {
    "id": "548e1980-33e8-4145-9c36-46cf7ccefcea",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "31.92 MB",
    "modified": "2025-07-18T05:16:19.634049Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "cec1bf8e-c3f0-459a-bb35-7a4f87edbe5c",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "31.92 MB",
    "modified": "2025-07-18T05:16:19.668050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "548e1980-33e8-4145-9c36-46cf7ccefcea"
  },
  {
    "id": "929164aa-c043-4e80-a798-f03d3372d3d5",
    "name": "7886-1.1-EOM_AN.pdf",
    "type": "file",
    "size": "26.61 MB",
    "modified": "2025-07-18T05:16:19.659050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/7886-1.1-EOM_AN/7886-1.1-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cec1bf8e-c3f0-459a-bb35-7a4f87edbe5c"
  },
  {
    "id": "5cdf62b9-9452-4120-aa4d-4f2497f139d6",
    "name": "DWG",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:19.673050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cec1bf8e-c3f0-459a-bb35-7a4f87edbe5c"
  },
  {
    "id": "bfbbe864-0f2b-45e1-8cd6-ec459d1b31be",
    "name": "7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "type": "file",
    "size": "3.77 MB",
    "modified": "2025-07-18T05:16:19.677050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5cdf62b9-9452-4120-aa4d-4f2497f139d6"
  },
  {
    "id": "1cc0b2c5-5e8b-4ecb-a498-7953177f21d3",
    "name": "7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "type": "file",
    "size": "1.54 MB",
    "modified": "2025-07-18T05:16:19.671050Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5cdf62b9-9452-4120-aa4d-4f2497f139d6"
  },
  {
    "id": "51162208-0453-40a7-9be5-f02f4e50262f",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "40.35 MB",
    "modified": "2025-07-18T05:16:19.806052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "846ca9c0-3937-49e1-8387-b6e6de345fdc",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "40.35 MB",
    "modified": "2025-07-18T05:16:19.841053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "51162208-0453-40a7-9be5-f02f4e50262f"
  },
  {
    "id": "9c1a1c12-9055-4c59-9554-9e19ac1af66f",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:19.819052Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "846ca9c0-3937-49e1-8387-b6e6de345fdc"
  },
  {
    "id": "9031b0dd-aa91-416b-94c3-bd3e4aa20739",
    "name": "7886-1.3-EOM_AN.pdf",
    "type": "file",
    "size": "11.47 MB",
    "modified": "2025-07-18T05:16:19.836053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/7886-1.3-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "846ca9c0-3937-49e1-8387-b6e6de345fdc"
  },
  {
    "id": "b3fa895f-44a6-472e-abdb-55008a26c0ca",
    "name": "DWG",
    "type": "folder",
    "size": "17.47 MB",
    "modified": "2025-07-18T05:16:19.894054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "846ca9c0-3937-49e1-8387-b6e6de345fdc"
  },
  {
    "id": "166ba0aa-2db3-4d77-8d0e-85939267f1d1",
    "name": "7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "type": "file",
    "size": "1.04 MB",
    "modified": "2025-07-18T05:16:19.873054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "c1cd4d62-a8a6-4656-8a3f-21464bc9b95a",
    "name": "7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "type": "file",
    "size": "1.93 MB",
    "modified": "2025-07-18T05:16:19.869053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "0d100baa-95fb-4f3a-93fb-af5000ca12a2",
    "name": "7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "type": "file",
    "size": "1.42 MB",
    "modified": "2025-07-18T05:16:19.865053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "340fee53-e984-453a-9af0-69565f32e109",
    "name": "7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "type": "file",
    "size": "293.25 KB",
    "modified": "2025-07-18T05:16:19.884054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "cdd47ab6-a609-47ef-ab7b-9ed36969ba39",
    "name": "7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "type": "file",
    "size": "640.98 KB",
    "modified": "2025-07-18T05:16:19.847053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "4481d298-47da-4cf9-9965-f29a7f299419",
    "name": "7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "type": "file",
    "size": "268.36 KB",
    "modified": "2025-07-18T05:16:19.891054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "1e61354f-a26f-4e9c-bec5-959f645147c6",
    "name": "7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "type": "file",
    "size": "624.10 KB",
    "modified": "2025-07-18T05:16:19.849053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "181eea5d-abeb-4ccd-8a98-73de8b207161",
    "name": "7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "type": "file",
    "size": "474.39 KB",
    "modified": "2025-07-18T05:16:19.855053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "dc3fd961-ea8e-4422-8b52-cddd93f7d3bb",
    "name": "7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "type": "file",
    "size": "695.24 KB",
    "modified": "2025-07-18T05:16:19.851053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "d5f957e2-7179-4b9f-a6d1-51adc8e90cbd",
    "name": "7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "type": "file",
    "size": "275.42 KB",
    "modified": "2025-07-18T05:16:19.881054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "a4fb87c2-0e78-4368-8f05-6adfb255831e",
    "name": "7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "type": "file",
    "size": "339.44 KB",
    "modified": "2025-07-18T05:16:19.893054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "96f0afe4-d0d3-4cea-b4bd-3f67616ed099",
    "name": "7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "type": "file",
    "size": "323.82 KB",
    "modified": "2025-07-18T05:16:19.845053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "1316c3cd-5714-401c-9720-698a1149921d",
    "name": "7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "type": "file",
    "size": "301.94 KB",
    "modified": "2025-07-18T05:16:19.850053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "b6f788ed-7d8e-4f5c-9a1c-d76e18045d24",
    "name": "7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "type": "file",
    "size": "253.55 KB",
    "modified": "2025-07-18T05:16:19.843053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "3bb94d8a-a04a-400f-bcf8-885ec4709be2",
    "name": "7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "type": "file",
    "size": "563.29 KB",
    "modified": "2025-07-18T05:16:19.853053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "f8391069-fd0d-4a1c-bf08-87153e4306f9",
    "name": "7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "type": "file",
    "size": "231.74 KB",
    "modified": "2025-07-18T05:16:19.883054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "12c19a92-fadf-48e0-9305-0dc817755c9a",
    "name": "7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "type": "file",
    "size": "1.65 MB",
    "modified": "2025-07-18T05:16:19.861053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "dca3d915-ea90-4740-9c99-41b501933eea",
    "name": "7886-1.3-ЭОМ_CO.xls",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:19.895054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-ЭОМ_CO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "815deee0-4e52-44a5-bc98-f4b526bfa0f5",
    "name": "7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "type": "file",
    "size": "340.96 KB",
    "modified": "2025-07-18T05:16:19.856053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "897955fe-d999-4be7-a22d-be7d5ff6c478",
    "name": "7886-1.3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "273.11 KB",
    "modified": "2025-07-18T05:16:19.858053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "edafa9d6-4edd-4d2e-b6d6-2a77f00fb653",
    "name": "7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.06 KB",
    "modified": "2025-07-18T05:16:19.842053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "c52e0027-dccc-457a-862b-6fe708f77d6e",
    "name": "7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "type": "file",
    "size": "466.61 KB",
    "modified": "2025-07-18T05:16:19.857053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "bc28c393-68f2-42b6-b745-fb48f25b651a",
    "name": "7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "type": "file",
    "size": "354.95 KB",
    "modified": "2025-07-18T05:16:19.886054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "e73fe61a-dbb4-4548-8fb8-ccf465a2b028",
    "name": "7886-1.3-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "88.84 KB",
    "modified": "2025-07-18T05:16:19.842053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "4c5e43e1-f688-45b5-861f-4fb6f95c1196",
    "name": "7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "type": "file",
    "size": "304.33 KB",
    "modified": "2025-07-18T05:16:19.887054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "e3d6ffa0-0950-4b89-9b63-cd72a4595ffe",
    "name": "7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "type": "file",
    "size": "377.08 KB",
    "modified": "2025-07-18T05:16:19.890054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "50719c6a-86da-43ba-b686-4c1bf5e9a2b1",
    "name": "7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "type": "file",
    "size": "2.01 MB",
    "modified": "2025-07-18T05:16:19.877053Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "b600b4f2-6577-4e1b-880c-2fff73ec56d3",
    "name": "7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "type": "file",
    "size": "323.02 KB",
    "modified": "2025-07-18T05:16:19.888054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "3d0e0bb8-d994-4f94-a961-636990e713d1",
    "name": "7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "type": "file",
    "size": "190.98 KB",
    "modified": "2025-07-18T05:16:19.883054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "e62011e7-4a8e-44c1-829a-ff923e4092d2",
    "name": "7886-1.3-EOM_25_SUP_A2.dwg",
    "type": "file",
    "size": "334.59 KB",
    "modified": "2025-07-18T05:16:19.880054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_25_SUP_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b3fa895f-44a6-472e-abdb-55008a26c0ca"
  },
  {
    "id": "5e8fd9a2-3efc-4c3c-bbf5-bdbb8fb69c25",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:19.899054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7e51735c-4a63-4cbd-8617-a9830918900a"
  },
  {
    "id": "32433bac-aba8-41d8-bfed-05eddee5564e",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:19.903054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5e8fd9a2-3efc-4c3c-bbf5-bdbb8fb69c25"
  },
  {
    "id": "b46bc6f4-8f6e-440f-9231-2a99af971b18",
    "name": "7886-10-EOM1.pdf",
    "type": "file",
    "size": "2.21 MB",
    "modified": "2025-07-18T05:16:19.901054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/7886-10-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "32433bac-aba8-41d8-bfed-05eddee5564e"
  },
  {
    "id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f",
    "name": "DWG",
    "type": "folder",
    "size": "8.26 MB",
    "modified": "2025-07-18T05:16:19.938055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "32433bac-aba8-41d8-bfed-05eddee5564e"
  },
  {
    "id": "25134821-3a75-4b01-a1b8-98204cb41e58",
    "name": "7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "type": "file",
    "size": "222.82 KB",
    "modified": "2025-07-18T05:16:19.907054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "839dcbc8-7134-4ea5-a2cf-d8070bf440aa",
    "name": "7886-10-EOM1_SO.pdf",
    "type": "file",
    "size": "138.97 KB",
    "modified": "2025-07-18T05:16:19.938055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "5e4d3bf6-0cfe-4d95-971d-eaeb134e1d45",
    "name": "7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "362.80 KB",
    "modified": "2025-07-18T05:16:19.937055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "5e9d6098-7ead-49a2-9366-903dbec02d25",
    "name": "7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "575.92 KB",
    "modified": "2025-07-18T05:16:19.923054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "923e125e-641c-4a10-b526-15c4a72c44f4",
    "name": "7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "type": "file",
    "size": "216.50 KB",
    "modified": "2025-07-18T05:16:19.909054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "3b12c49f-e11c-43e9-b16b-ade697fff95b",
    "name": "7886-10-EOM1_SO.xls",
    "type": "file",
    "size": "925.00 KB",
    "modified": "2025-07-18T05:16:19.939055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "f03ac239-1bd9-48ec-8d3a-818775555347",
    "name": "7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "type": "file",
    "size": "249.44 KB",
    "modified": "2025-07-18T05:16:19.906054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "b17b93e1-983f-4c23-8557-be8c849be6b6",
    "name": "7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "type": "file",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:19.933055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "fae85ba5-ddf3-4638-99cc-974faec06a1d",
    "name": "7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "1019.38 KB",
    "modified": "2025-07-18T05:16:19.919054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "8ad569af-8242-4295-9e74-d48d66cdd63d",
    "name": "7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "636.42 KB",
    "modified": "2025-07-18T05:16:19.921054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "81191d85-ed94-474d-ad0c-d39161120ede",
    "name": "7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "type": "file",
    "size": "174.90 KB",
    "modified": "2025-07-18T05:16:19.936055Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "b9613875-8966-4da1-8b63-db4010be0d4c",
    "name": "7886-10-EOM1_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.26 KB",
    "modified": "2025-07-18T05:16:19.904054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "377e7966-f797-4e9e-9e53-d0fcc9b9b97b",
    "name": "7886-10-EOM1_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "131.68 KB",
    "modified": "2025-07-18T05:16:19.905054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "72d502b8-2cac-453e-9cea-f47da03ea631",
    "name": "7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "506.06 KB",
    "modified": "2025-07-18T05:16:19.914054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "83289223-8bd7-4057-8105-1ef2c4bed200",
    "name": "7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "type": "file",
    "size": "208.71 KB",
    "modified": "2025-07-18T05:16:19.910054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "43be8bf0-198a-4a8f-8c70-f7a2e2ca4a7f",
    "name": "7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "type": "file",
    "size": "204.20 KB",
    "modified": "2025-07-18T05:16:19.908054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "080832df-cf86-4cf6-b6bd-ba78895dfee1",
    "name": "7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "type": "file",
    "size": "507.46 KB",
    "modified": "2025-07-18T05:16:19.916054Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/EOM-ЭОМ-Электрооборудование 16-04-2025/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bb0fd91b-ff26-4952-ba6a-7988f05e9a0f"
  },
  {
    "id": "24a00468-8aa1-4ef2-a4cc-60e047ede3d5",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:19.473046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0ac45d2a-07e2-49f6-8813-d09a830ceed1"
  },
  {
    "id": "14c026c0-46d2-45c3-8f94-32204367b0c6",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:19.480046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "24a00468-8aa1-4ef2-a4cc-60e047ede3d5"
  },
  {
    "id": "ff463f6c-3567-4065-b8e1-643dbd975e3e",
    "name": "7886-10-EOM1.pdf",
    "type": "file",
    "size": "2.21 MB",
    "modified": "2025-07-18T05:16:19.477046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/7886-10-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "14c026c0-46d2-45c3-8f94-32204367b0c6"
  },
  {
    "id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696",
    "name": "DWG",
    "type": "folder",
    "size": "8.26 MB",
    "modified": "2025-07-18T05:16:19.517047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "14c026c0-46d2-45c3-8f94-32204367b0c6"
  },
  {
    "id": "c115d750-6934-4cae-8cec-fc9398fd28e2",
    "name": "7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "type": "file",
    "size": "222.82 KB",
    "modified": "2025-07-18T05:16:19.488046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "f5b468cc-9a54-4ce5-b017-e696dfc5c6cf",
    "name": "7886-10-EOM1_SO.pdf",
    "type": "file",
    "size": "138.97 KB",
    "modified": "2025-07-18T05:16:19.515047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "4cb5f909-d7c2-4e88-8496-01b15727d4d8",
    "name": "7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "362.80 KB",
    "modified": "2025-07-18T05:16:19.514047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "01fc918c-5f3d-4ddc-a2d8-020a648b27f0",
    "name": "7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "575.92 KB",
    "modified": "2025-07-18T05:16:19.507047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "1005ea90-1342-4935-bbf7-459ef18c9ba0",
    "name": "7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "type": "file",
    "size": "216.50 KB",
    "modified": "2025-07-18T05:16:19.490047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "610ed5a7-fc86-428d-a133-395946a1909f",
    "name": "7886-10-EOM1_SO.xls",
    "type": "file",
    "size": "925.00 KB",
    "modified": "2025-07-18T05:16:19.518047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "4f9367ac-2085-4691-ac20-e01ff8da61b0",
    "name": "7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "type": "file",
    "size": "249.44 KB",
    "modified": "2025-07-18T05:16:19.486046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "ae1583e2-dd88-4415-8c62-de02524c3662",
    "name": "7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "type": "file",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:19.511047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "ea6ac0b3-343c-4577-830c-6a62f63e3c5e",
    "name": "7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "1019.38 KB",
    "modified": "2025-07-18T05:16:19.501047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "c9c77371-7949-4baa-a505-5dbb9c66cc41",
    "name": "7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "636.42 KB",
    "modified": "2025-07-18T05:16:19.504047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "03c123d0-6bae-4627-8621-b3a2b262102f",
    "name": "7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "type": "file",
    "size": "174.90 KB",
    "modified": "2025-07-18T05:16:19.513047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "26347295-65e1-4166-acc8-4f9d14708bdb",
    "name": "7886-10-EOM1_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.26 KB",
    "modified": "2025-07-18T05:16:19.482046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "8b941266-35bd-48d3-9e98-e69eaf89b7b6",
    "name": "7886-10-EOM1_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "131.68 KB",
    "modified": "2025-07-18T05:16:19.483046Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "70f38b2c-8c97-4af6-ae23-855060511c30",
    "name": "7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "506.06 KB",
    "modified": "2025-07-18T05:16:19.494047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "5231fd12-a8fa-407f-8c45-81fb1bae77bb",
    "name": "7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "type": "file",
    "size": "208.71 KB",
    "modified": "2025-07-18T05:16:19.492047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "021720c0-7fdc-476f-b901-7f8207638946",
    "name": "7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "type": "file",
    "size": "204.20 KB",
    "modified": "2025-07-18T05:16:19.489047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "8962bb99-a734-4038-a8d8-bbe34f3dd15f",
    "name": "7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "type": "file",
    "size": "507.46 KB",
    "modified": "2025-07-18T05:16:19.498047Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/архив/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b6384ab-00b2-4f51-a1cf-cb30889bb696"
  },
  {
    "id": "2d3aec3e-181e-459f-a562-e74313ad4d7a",
    "name": "7886-4-EOM",
    "type": "folder",
    "size": "7.74 MB",
    "modified": "2025-07-18T05:16:18.988037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "9f2812cc-ae4c-473d-8fcc-522d95022e86",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:18.986037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2d3aec3e-181e-459f-a562-e74313ad4d7a"
  },
  {
    "id": "59501be0-4fca-47c3-b2e0-8590189ff6bc",
    "name": "DWG",
    "type": "folder",
    "size": "5.83 MB",
    "modified": "2025-07-18T05:16:19.015038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2d3aec3e-181e-459f-a562-e74313ad4d7a"
  },
  {
    "id": "dcf36224-4c65-4a98-968f-ca40b30e53cc",
    "name": "7886-4-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "86.72 KB",
    "modified": "2025-07-18T05:16:18.993037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "191157f1-998d-4b84-a2e9-506a3e3f1edc",
    "name": "7886-4-EOM_05_sila_pl_0,000_А4x3.dwg",
    "type": "file",
    "size": "881.26 KB",
    "modified": "2025-07-18T05:16:19.005038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_05_sila_pl_0,000_А4x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "20f5b780-196c-4ac4-9b9b-e4a4e9787de7",
    "name": "7886-4-EOM_07_uzly lotkov_pl_А3.dwg",
    "type": "file",
    "size": "841.65 KB",
    "modified": "2025-07-18T05:16:19.010038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_07_uzly lotkov_pl_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "37b34bed-2ab0-46e4-aba8-48bd33b8e70e",
    "name": "7886-4-EOM_08_molniez_zazem_pl_А2.dwg",
    "type": "file",
    "size": "577.28 KB",
    "modified": "2025-07-18T05:16:19.014038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_08_molniez_zazem_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "008cee71-6f2a-4620-9170-c99e9c2cc501",
    "name": "7886-4-EOM.SO.xls",
    "type": "file",
    "size": "1.07 MB",
    "modified": "2025-07-18T05:16:18.991037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "b9feb006-0b45-4270-aadf-d93968426ce5",
    "name": "7886-4-EOM_03.2_sh_ppu-kpp1_А3.dwg",
    "type": "file",
    "size": "321.87 KB",
    "modified": "2025-07-18T05:16:19.001038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_03.2_sh_ppu-kpp1_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "955cf83b-ec4d-439d-9d47-0de8168cd618",
    "name": "7886-4-EOM_03.1_sh_vru4_А1.dwg",
    "type": "file",
    "size": "327.80 KB",
    "modified": "2025-07-18T05:16:19.000037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_03.1_sh_vru4_А1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "d2a81dc1-4dec-4d0c-8a31-a1a8419f0475",
    "name": "7886-4-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.31 KB",
    "modified": "2025-07-18T05:16:18.992037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "bd93d761-19cb-4962-9ab9-67748c712da7",
    "name": "7886-4-EOM_09_vvod_pl_0,000_А3.dwg",
    "type": "file",
    "size": "419.59 KB",
    "modified": "2025-07-18T05:16:19.016038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_09_vvod_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "986560c5-d8ec-4a15-a2ee-007b09f794a8",
    "name": "7886-4-EOM_04_sh_shuv_А4.dwg",
    "type": "file",
    "size": "348.73 KB",
    "modified": "2025-07-18T05:16:19.003037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_04_sh_shuv_А4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "f66bb1f8-4643-4264-8337-0882f824dcaa",
    "name": "7886-4-EOM_06_osv_pl_0,000_А3.dwg",
    "type": "file",
    "size": "468.75 KB",
    "modified": "2025-07-18T05:16:19.007038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_06_osv_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "326223ad-787c-481a-bb98-65284511305d",
    "name": "7886-4-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "291.30 KB",
    "modified": "2025-07-18T05:16:18.996037Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "c11c8bbb-ed27-427c-88a3-c5c73cde23c8",
    "name": "7886-4-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "222.34 KB",
    "modified": "2025-07-18T05:16:18.998038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-4-EOM/DWG/7886-4-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "59501be0-4fca-47c3-b2e0-8590189ff6bc"
  },
  {
    "id": "e7791bdc-647b-45bc-a1d1-db8454bf6e0b",
    "name": "7886-5-EOM",
    "type": "folder",
    "size": "28.38 MB",
    "modified": "2025-07-18T05:16:19.022038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "b191cb33-0051-4345-925b-77a683ce5c8d",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:19.020038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7791bdc-647b-45bc-a1d1-db8454bf6e0b"
  },
  {
    "id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4",
    "name": "DWG",
    "type": "folder",
    "size": "26.48 MB",
    "modified": "2025-07-18T05:16:19.079039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7791bdc-647b-45bc-a1d1-db8454bf6e0b"
  },
  {
    "id": "3f89e23b-4821-46f9-84a0-ca4a78ebcf1a",
    "name": "7886-5-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "220.25 KB",
    "modified": "2025-07-18T05:16:19.029038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "87717854-ab29-4d3f-bb0c-8e4904968508",
    "name": "7886-5-EOM_06_osv_pl_0,000_А2.dwg",
    "type": "file",
    "size": "406.21 KB",
    "modified": "2025-07-18T05:16:19.037038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_06_osv_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "dd6fffea-33ba-4f3d-b045-95c8f3094fe1",
    "name": "7886-5-EOM_03.2_sh_PPU-KPP2_А3.dwg",
    "type": "file",
    "size": "341.32 KB",
    "modified": "2025-07-18T05:16:19.030038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_03.2_sh_PPU-KPP2_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "83c6e604-1e20-4ad3-aee2-8830538279c9",
    "name": "7886-5-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "86.69 KB",
    "modified": "2025-07-18T05:16:19.027038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "a345eba6-84e5-4b96-8cac-5b05b73f856c",
    "name": "7886-5-EOM.SO.xls",
    "type": "file",
    "size": "1.08 MB",
    "modified": "2025-07-18T05:16:19.025038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "60340251-1f6b-4f3a-a53d-8d7e7a75203c",
    "name": "7886-5-EOM_09_vvod_pl_0,000_А3.dwg",
    "type": "file",
    "size": "664.75 KB",
    "modified": "2025-07-18T05:16:19.079039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_09_vvod_pl_0,000_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "57a4abfc-8ff7-4ed2-986e-ce25d052f3bf",
    "name": "7886-5-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.25 KB",
    "modified": "2025-07-18T05:16:19.026038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "8b567842-99f8-45d7-a160-a8500aa210ae",
    "name": "7886-5-EOM_07_uzly lotkov_pl_А3.dwg",
    "type": "file",
    "size": "21.39 MB",
    "modified": "2025-07-18T05:16:19.067039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_07_uzly lotkov_pl_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "01f6caab-80db-4540-be28-f0dffc2ba255",
    "name": "7886-5-EOM_04_sh_SHUV_А4.dwg",
    "type": "file",
    "size": "358.64 KB",
    "modified": "2025-07-18T05:16:19.032038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_04_sh_SHUV_А4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "4324a990-c797-425c-8665-ff6f393b1d3b",
    "name": "7886-5-EOM_03_1_sh_VRU5_А4х4.dwg",
    "type": "file",
    "size": "359.30 KB",
    "modified": "2025-07-18T05:16:19.031038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_03_1_sh_VRU5_А4х4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "b9740409-b723-4929-8af0-6321171b881b",
    "name": "7886-5-EOM_05_sila_pl_0,000_А3x3.dwg",
    "type": "file",
    "size": "711.51 KB",
    "modified": "2025-07-18T05:16:19.035038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_05_sila_pl_0,000_А3x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "730db466-4a4c-4f35-85ad-ec8b578908f6",
    "name": "7886-5-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "315.82 KB",
    "modified": "2025-07-18T05:16:19.028038Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "20126f3e-0b83-43ac-a744-aa7d589df983",
    "name": "7886-5-EOM_08_molniez_zazem_pl_А3x3.dwg",
    "type": "file",
    "size": "561.54 KB",
    "modified": "2025-07-18T05:16:19.077039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-5-EOM/DWG/7886-5-EOM_08_molniez_zazem_pl_А3x3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fd9f07e3-c5f5-41fe-b940-15cec438f8d4"
  },
  {
    "id": "704e7dab-6f19-4c79-9994-7128b78300b9",
    "name": "7886-2-EOM",
    "type": "folder",
    "size": "2.92 MB",
    "modified": "2025-07-18T05:16:18.906036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "c1cb7133-aff7-4ead-9dd9-17d4bac6a57e",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:18.905036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "704e7dab-6f19-4c79-9994-7128b78300b9"
  },
  {
    "id": "054d93c5-2c8e-46e6-9f44-40478b585c1a",
    "name": "DWG",
    "type": "folder",
    "size": "2.03 MB",
    "modified": "2025-07-18T05:16:18.915036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "704e7dab-6f19-4c79-9994-7128b78300b9"
  },
  {
    "id": "bb3e05df-8258-40c3-9254-ffe3f47ee217",
    "name": "7886-2-EOM_03_plany osv sil zaz.dwg",
    "type": "file",
    "size": "311.30 KB",
    "modified": "2025-07-18T05:16:18.913036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM_03_plany osv sil zaz.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "a6490e36-60a3-4946-8842-cb646e01a25e",
    "name": "7886-2-EOM_Titulniy.dwg",
    "type": "file",
    "size": "143.01 KB",
    "modified": "2025-07-18T05:16:18.915036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM_Titulniy.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "c4becc50-55b2-4b39-a4e6-38411fc7f801",
    "name": "7886-2-EOM_02_shema.dwg",
    "type": "file",
    "size": "202.91 KB",
    "modified": "2025-07-18T05:16:18.911036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM_02_shema.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "298eba6a-02ec-4e81-947e-97967f74581e",
    "name": "7886-2-EOM.SO.xls",
    "type": "file",
    "size": "1.04 MB",
    "modified": "2025-07-18T05:16:18.909036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM.SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "bf154b05-bbdc-438d-8931-74f0c89df89e",
    "name": "7886-2-EOM_01_Obdan.dwg",
    "type": "file",
    "size": "276.13 KB",
    "modified": "2025-07-18T05:16:18.910036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM_01_Obdan.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "3c1328b8-9983-49b1-8449-b0b2845cc1f9",
    "name": "7886-2-EOM_Oblozhka.dwg",
    "type": "file",
    "size": "85.03 KB",
    "modified": "2025-07-18T05:16:18.914036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-2-EOM/DWG/7886-2-EOM_Oblozhka.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "054d93c5-2c8e-46e6-9f44-40478b585c1a"
  },
  {
    "id": "ee9a214a-a462-44f0-9394-220dc055369a",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "45.13 MB",
    "modified": "2025-07-18T05:16:18.655031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "5a334bab-f88e-4baa-a659-6dcefb214002",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "45.13 MB",
    "modified": "2025-07-18T05:16:18.685032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ee9a214a-a462-44f0-9394-220dc055369a"
  },
  {
    "id": "9b4e55eb-48c3-4000-9f14-c75f5a996a9a",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:18.665031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5a334bab-f88e-4baa-a659-6dcefb214002"
  },
  {
    "id": "8af4f347-f770-4a49-8bec-7b9b1df05055",
    "name": "7886-1.2-EOM1_AN.pdf",
    "type": "file",
    "size": "10.86 MB",
    "modified": "2025-07-18T05:16:18.680032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/7886-1.2-EOM1_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5a334bab-f88e-4baa-a659-6dcefb214002"
  },
  {
    "id": "10b5f978-4e26-427f-aa34-6a7986a97888",
    "name": "DWG",
    "type": "folder",
    "size": "24.94 MB",
    "modified": "2025-07-18T05:16:18.756033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5a334bab-f88e-4baa-a659-6dcefb214002"
  },
  {
    "id": "d3d7d4bd-891d-4cc4-86da-293d11418c1f",
    "name": "7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:18.749033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_26_zazem_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "0e515b11-bbcb-45f5-b7ef-5ee11f6beef2",
    "name": "7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.87 MB",
    "modified": "2025-07-18T05:16:18.724032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_21_osv_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "7b776186-ed8c-4026-ad69-60d5f92432f0",
    "name": "7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "type": "file",
    "size": "240.00 KB",
    "modified": "2025-07-18T05:16:18.690032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_03_uchet_LVDP1.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "ec45bd20-f5b8-4355-b79f-8a3c3cda8760",
    "name": "7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "type": "file",
    "size": "200.17 KB",
    "modified": "2025-07-18T05:16:18.698032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_11_sh_SHUVV2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "05adb374-4d54-44ed-89dd-38fa971868ca",
    "name": "7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.92 MB",
    "modified": "2025-07-18T05:16:18.739033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_24_lotok_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "568c1010-0998-494e-ba73-e10e3ca6a6be",
    "name": "7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "type": "file",
    "size": "266.39 KB",
    "modified": "2025-07-18T05:16:18.697032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_10_sh_SHRX_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "5102a907-5dda-4114-8b0e-24f957603c40",
    "name": "7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "type": "file",
    "size": "219.57 KB",
    "modified": "2025-07-18T05:16:18.754033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_28_Scheme_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "7b51dae7-8319-44e0-a210-aa7e96cf2a76",
    "name": "7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "type": "file",
    "size": "144.42 KB",
    "modified": "2025-07-18T05:16:18.687032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_00_Titulniy_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "ebb1fc40-6dca-4d25-b67e-2d1ab9ec0715",
    "name": "7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "type": "file",
    "size": "194.01 KB",
    "modified": "2025-07-18T05:16:18.693032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_06_sh_SHR184_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "1b71d03f-8617-48c4-9b25-19184d3f79d8",
    "name": "7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "type": "file",
    "size": "308.20 KB",
    "modified": "2025-07-18T05:16:18.691032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_04_sh_SHPPC3_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "2b4d0aad-11ee-4168-ba6d-4a1d793e1be5",
    "name": "7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "type": "file",
    "size": "199.54 KB",
    "modified": "2025-07-18T05:16:18.704032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_16_sh_SHAOBB_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "2cb6e905-9983-4736-a25c-42d5f18b2a89",
    "name": "7886-1.2-ЭОМ1_SO.xls",
    "type": "file",
    "size": "1.10 MB",
    "modified": "2025-07-18T05:16:18.758033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "91d44952-8fc9-488a-8754-3fa588f0def3",
    "name": "7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "type": "file",
    "size": "272.06 KB",
    "modified": "2025-07-18T05:16:18.696032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_09_sh_SHR2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "7ffc7520-a7ef-44e6-b95d-f55f0239f3f5",
    "name": "7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "type": "file",
    "size": "189.51 KB",
    "modified": "2025-07-18T05:16:18.700032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_13_sh_SHDU2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "689f857b-7671-461e-963b-2925a18d955d",
    "name": "7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "type": "file",
    "size": "95.76 KB",
    "modified": "2025-07-18T05:16:18.686032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_000_Oblozhka_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "c9e9a5d9-4102-410e-8f7c-b2bac494f17f",
    "name": "7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.48 MB",
    "modified": "2025-07-18T05:16:18.717032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_20_Krovlya_pl_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "f9f044e6-a591-41b3-8c13-11911c0e8d76",
    "name": "7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.18 MB",
    "modified": "2025-07-18T05:16:18.729033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_22_osv_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "4d4d9398-4c18-47d7-be55-0a47e8070c06",
    "name": "7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.14 MB",
    "modified": "2025-07-18T05:16:18.753033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_27_zazem_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "c254ef9d-072e-48fe-8fcd-74a238d9b82e",
    "name": "7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "type": "file",
    "size": "303.52 KB",
    "modified": "2025-07-18T05:16:18.701032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_14_sh_SHO208.1_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "489ccb79-a7b2-4431-b908-4f66ea2cb491",
    "name": "7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "type": "file",
    "size": "2.52 MB",
    "modified": "2025-07-18T05:16:18.708032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_18_sila_pl_0,000_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "5dc6f18c-081f-474b-9b85-2df258b7a05e",
    "name": "7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:18.712032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_19_sila_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "77cd3953-f468-415c-aca1-11d93b395f89",
    "name": "7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "type": "file",
    "size": "190.28 KB",
    "modified": "2025-07-18T05:16:18.702032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_15_sh_SHO208.2_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "501664db-315e-4429-9b23-6ae20ec1910c",
    "name": "7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "type": "file",
    "size": "261.34 KB",
    "modified": "2025-07-18T05:16:18.688032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_01_ob_dan_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "bb8a8b84-ce0c-4af3-947c-15eee57c49a3",
    "name": "7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "type": "file",
    "size": "330.04 KB",
    "modified": "2025-07-18T05:16:18.693032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_05_sh_SHTN2_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "788b94eb-660b-4a55-9bc8-4ea298b23a03",
    "name": "7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "type": "file",
    "size": "210.26 KB",
    "modified": "2025-07-18T05:16:18.695032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_07_sh_SHR183_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "a58440ef-e55d-4c9e-bf28-90890adf7646",
    "name": "7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "type": "file",
    "size": "238.39 KB",
    "modified": "2025-07-18T05:16:18.755033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_29_Eksplikaciya_Pomescheniy_A2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "e20c8279-8747-40f6-82a3-720d029323cf",
    "name": "7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "type": "file",
    "size": "861.42 KB",
    "modified": "2025-07-18T05:16:18.734033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_23_Scheme. upr. osv_А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "e76c2f48-4e21-4bbc-baf0-e28a9f62dee9",
    "name": "7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "type": "file",
    "size": "206.33 KB",
    "modified": "2025-07-18T05:16:18.689032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_02_sh_LVDP1.1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "08817c3b-90ed-4488-9a17-5e2dcf97637f",
    "name": "7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "type": "file",
    "size": "199.62 KB",
    "modified": "2025-07-18T05:16:18.695032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_08_sh_SHR1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "80370770-1d88-4325-984b-aac4f39d856c",
    "name": "7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "type": "file",
    "size": "212.64 KB",
    "modified": "2025-07-18T05:16:18.705032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_17_sh_SHNOABB1_А2_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "ddf1eb20-4efe-41d0-993e-cfb80455632e",
    "name": "7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "type": "file",
    "size": "1.46 MB",
    "modified": "2025-07-18T05:16:18.744033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_25_lotok_pl_ +4800_А1х3_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "caefdc25-c3dd-4146-b4d3-31b0f60fb147",
    "name": "7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "type": "file",
    "size": "386.10 KB",
    "modified": "2025-07-18T05:16:18.699032Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.2-EOM1/7886-1.2-EOM1/DWG/7886-1.2-ЭОМ1_12_sh_SHRCerv_ SHRIT_ SHROT_ SHR104 _А1_RevD.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b5f978-4e26-427f-aa34-6a7986a97888"
  },
  {
    "id": "de2c7893-3b6d-4312-b489-070baf15c321",
    "name": "7886-7-EOM",
    "type": "folder",
    "size": "29.34 MB",
    "modified": "2025-07-18T05:16:19.086039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "3349884e-b7c4-4713-849f-5384e5a460d2",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:19.084039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "de2c7893-3b6d-4312-b489-070baf15c321"
  },
  {
    "id": "31ffa48b-a193-409e-a00e-39884e160af9",
    "name": "DWG",
    "type": "folder",
    "size": "26.66 MB",
    "modified": "2025-07-18T05:16:19.142040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "de2c7893-3b6d-4312-b489-070baf15c321"
  },
  {
    "id": "eb30da29-2774-4bc8-984b-561574f0c6df",
    "name": "7886-7-EOM_02_ob_dan_A4.dwg",
    "type": "file",
    "size": "177.37 KB",
    "modified": "2025-07-18T05:16:19.089039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_02_ob_dan_A4.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "fb499b98-1644-489d-8071-38d393778123",
    "name": "7886-7-EOM_03_sh_VRU7_А2.dwg",
    "type": "file",
    "size": "281.93 KB",
    "modified": "2025-07-18T05:16:19.090039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_03_sh_VRU7_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "bdce65df-226a-42de-994d-2a18143fe6c2",
    "name": "7886-7-EOM_01_ob_dan_A3.dwg",
    "type": "file",
    "size": "203.28 KB",
    "modified": "2025-07-18T05:16:19.089039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_01_ob_dan_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "cbb72aea-d2d1-4b10-8ee1-32610a750d1e",
    "name": "7886-7-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "85.41 KB",
    "modified": "2025-07-18T05:16:19.088039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "0b089873-74bc-46ba-ab11-6ed2ab778e0c",
    "name": "7886-7-EOM_08_molniez_zazem_pl_А2.dwg",
    "type": "file",
    "size": "2.93 MB",
    "modified": "2025-07-18T05:16:19.141040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_08_molniez_zazem_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "6a5c4f4a-d334-4b5a-b8e3-12f84eda40ab",
    "name": "7886-7-EOM_07_uzly lotkov_pl_А2.dwg",
    "type": "file",
    "size": "21.61 MB",
    "modified": "2025-07-18T05:16:19.127040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_07_uzly lotkov_pl_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "4d17c4bf-6e82-4ca7-becf-a916f096a07b",
    "name": "7886-7-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "85.57 KB",
    "modified": "2025-07-18T05:16:19.087039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "e7a57f94-3fc6-4a78-8b56-2ee146262379",
    "name": "7886-7-EOM_06_osv_pl_0,000_А2.dwg",
    "type": "file",
    "size": "306.07 KB",
    "modified": "2025-07-18T05:16:19.095039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_06_osv_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "53d16609-b6ca-4ffa-810e-b85ac2d61228",
    "name": "7886-7-EOM_09_Vvod_pl_0,000_А2.dwg",
    "type": "file",
    "size": "464.92 KB",
    "modified": "2025-07-18T05:16:19.143040Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_09_Vvod_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "830fdb13-0f22-43bd-a2cd-643dc5e17bc9",
    "name": "7886-7-EOM_05_sila_pl_0,000_А2.dwg",
    "type": "file",
    "size": "314.13 KB",
    "modified": "2025-07-18T05:16:19.093039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_05_sila_pl_0,000_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "d7a4915d-e1c3-4090-ad27-aa170c80bf3d",
    "name": "7886-7-EOM_04_sh_SHPPU7_А3.dwg",
    "type": "file",
    "size": "257.78 KB",
    "modified": "2025-07-18T05:16:19.092039Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-7-EOM/DWG/7886-7-EOM_04_sh_SHPPU7_А3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "31ffa48b-a193-409e-a00e-39884e160af9"
  },
  {
    "id": "fbacb130-9e14-470c-be30-89ecb3dfdd77",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "31.92 MB",
    "modified": "2025-07-18T05:16:18.606030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "ea93f3ff-d4d2-4e67-a260-f9bdbc7002d1",
    "name": "7886-1.1-EOM_AN",
    "type": "folder",
    "size": "31.92 MB",
    "modified": "2025-07-18T05:16:18.644031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/7886-1.1-EOM_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fbacb130-9e14-470c-be30-89ecb3dfdd77"
  },
  {
    "id": "2fb975c9-55d0-40bc-8e8e-4f0b3738602c",
    "name": "7886-1.1-EOM_AN.pdf",
    "type": "file",
    "size": "26.61 MB",
    "modified": "2025-07-18T05:16:18.631031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/7886-1.1-EOM_AN/7886-1.1-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea93f3ff-d4d2-4e67-a260-f9bdbc7002d1"
  },
  {
    "id": "0b1a2f18-b753-4edd-b3fa-0df8f59802e6",
    "name": "DWG",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:18.648031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea93f3ff-d4d2-4e67-a260-f9bdbc7002d1"
  },
  {
    "id": "ce10df76-d0ab-4247-93be-001ecf3bfcca",
    "name": "7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "type": "file",
    "size": "3.77 MB",
    "modified": "2025-07-18T05:16:18.652031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_27-30_Pl_sila_0000_А0_A1_А2х3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0b1a2f18-b753-4edd-b3fa-0df8f59802e6"
  },
  {
    "id": "b5fde622-74fa-4b51-afd4-cba2134863f5",
    "name": "7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "type": "file",
    "size": "1.54 MB",
    "modified": "2025-07-18T05:16:18.647031Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.1-EOM_AN/7886-1.1-EOM_AN/DWG/7886-1.1-EOM_24_Pl_osv_0000_A1x3_АН_Rev1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0b1a2f18-b753-4edd-b3fa-0df8f59802e6"
  },
  {
    "id": "dec77e59-ac75-4102-abd2-46de1fffca33",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "40.35 MB",
    "modified": "2025-07-18T05:16:18.761033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "98dcefd0-39c7-4ab5-a4fc-5d7dc4e2142c",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "40.35 MB",
    "modified": "2025-07-18T05:16:18.805034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dec77e59-ac75-4102-abd2-46de1fffca33"
  },
  {
    "id": "4b7d774c-2066-4482-b54b-7f183e539638",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:18.780033Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "98dcefd0-39c7-4ab5-a4fc-5d7dc4e2142c"
  },
  {
    "id": "40235ba7-a61a-4971-80cd-d366a5bb7ad7",
    "name": "7886-1.3-EOM_AN.pdf",
    "type": "file",
    "size": "11.47 MB",
    "modified": "2025-07-18T05:16:18.801034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/7886-1.3-EOM_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "98dcefd0-39c7-4ab5-a4fc-5d7dc4e2142c"
  },
  {
    "id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f",
    "name": "DWG",
    "type": "folder",
    "size": "17.47 MB",
    "modified": "2025-07-18T05:16:18.859035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "98dcefd0-39c7-4ab5-a4fc-5d7dc4e2142c"
  },
  {
    "id": "5081a177-c44b-4480-90ed-96ca0ae83a77",
    "name": "7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "type": "file",
    "size": "1.04 MB",
    "modified": "2025-07-18T05:16:18.838035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_23_Pl_zaz_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "875046bf-c1c1-4a6d-872a-77caee892329",
    "name": "7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "type": "file",
    "size": "1.93 MB",
    "modified": "2025-07-18T05:16:18.835034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_22_Pl_kl_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "1a1fd7ee-2816-466f-9686-5a7a5934de6f",
    "name": "7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "type": "file",
    "size": "1.42 MB",
    "modified": "2025-07-18T05:16:18.830034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_21_Pl_kl_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "5ceaecf8-4f32-41c6-8a37-8b4a91460c47",
    "name": "7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "type": "file",
    "size": "293.25 KB",
    "modified": "2025-07-18T05:16:18.850035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_3_Sh_shgp_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "8cdbbf12-e719-433c-9f46-5db249842e1d",
    "name": "7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "type": "file",
    "size": "640.98 KB",
    "modified": "2025-07-18T05:16:18.810034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_12_Pl_osv_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "0b0f33a9-548f-463e-aeef-32e1804f0a0d",
    "name": "7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "type": "file",
    "size": "268.36 KB",
    "modified": "2025-07-18T05:16:18.856035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_8_Sh_shrtz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "07401d16-f50a-4a8c-96f3-4f071a2c8a38",
    "name": "7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "type": "file",
    "size": "624.10 KB",
    "modified": "2025-07-18T05:16:18.812034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_13_Pl_osv_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "232eb96c-c50d-40c3-8c36-54c7052923f1",
    "name": "7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "type": "file",
    "size": "474.39 KB",
    "modified": "2025-07-18T05:16:18.820034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_17_Pl_sil_abk_0000_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "53b72bf4-2db8-415e-b4ef-e267f0ae7ee6",
    "name": "7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "type": "file",
    "size": "695.24 KB",
    "modified": "2025-07-18T05:16:18.816034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_15_Pl_osv_fasad_0000_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "8aff6cfe-beca-432a-ab2e-b541579ad27e",
    "name": "7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "type": "file",
    "size": "275.42 KB",
    "modified": "2025-07-18T05:16:18.846035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_26_Pl_rasp_set'_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "67090e9b-3c38-4406-8246-051bad3da60c",
    "name": "7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "type": "file",
    "size": "339.44 KB",
    "modified": "2025-07-18T05:16:18.858035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_9_Sh_shr1_A3.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "8a09f481-0c50-4803-8fbb-b61e140e7012",
    "name": "7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "type": "file",
    "size": "323.82 KB",
    "modified": "2025-07-18T05:16:18.809034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_11_Sh_shrz_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "adba330a-b775-438d-9309-a009e0aa3c21",
    "name": "7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "type": "file",
    "size": "301.94 KB",
    "modified": "2025-07-18T05:16:18.814034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_14_Pl_osv_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "ae3d85c1-c793-410e-a92c-459cbf61272a",
    "name": "7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "type": "file",
    "size": "253.55 KB",
    "modified": "2025-07-18T05:16:18.808034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_10_Sh_shr2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "49c24219-867f-4b21-960d-d992bffc63a7",
    "name": "7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "type": "file",
    "size": "563.29 KB",
    "modified": "2025-07-18T05:16:18.818034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_16_Pl_sil_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "4b83b674-cdde-4837-a00e-6baf81cc7b04",
    "name": "7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "type": "file",
    "size": "231.74 KB",
    "modified": "2025-07-18T05:16:18.847035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_27_Sh_strukt_sch_teh_uch_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "5eb39afa-d4be-41bf-97c9-adf1e266551d",
    "name": "7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "type": "file",
    "size": "1.65 MB",
    "modified": "2025-07-18T05:16:18.827034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_20_Pl_kl_0000_A0.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "bbd25e0b-d230-4048-b80f-0a3b70582855",
    "name": "7886-1.3-ЭОМ_CO.xls",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:18.860035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-ЭОМ_CO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "8a1417fa-2cdc-4ead-806e-0df04d794b86",
    "name": "7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "type": "file",
    "size": "340.96 KB",
    "modified": "2025-07-18T05:16:18.822034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_18_Pl_sil_abk_4200_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "657c3221-5b67-4adc-a42a-decd17f0a4bf",
    "name": "7886-1.3-EOM_1_OD_A2.dwg",
    "type": "file",
    "size": "273.11 KB",
    "modified": "2025-07-18T05:16:18.824034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_1_OD_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "56948b6e-f67c-40b9-a3f9-205fe52817b2",
    "name": "7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.06 KB",
    "modified": "2025-07-18T05:16:18.806034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "80527ed5-87b2-45ca-bfbd-f4951ed92c91",
    "name": "7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "type": "file",
    "size": "466.61 KB",
    "modified": "2025-07-18T05:16:18.823034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_19_Pl_sil_krovli_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "4aaa88a5-f857-45d3-bd13-3a498b8c9698",
    "name": "7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "type": "file",
    "size": "354.95 KB",
    "modified": "2025-07-18T05:16:18.851035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_4_Sh_vru ps_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "79fc5970-c468-4b3a-a294-3cf6106d4ca3",
    "name": "7886-1.3-EOM_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "88.84 KB",
    "modified": "2025-07-18T05:16:18.806034Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "548ff236-1fe6-4fe1-af48-11ba87553e54",
    "name": "7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "type": "file",
    "size": "304.33 KB",
    "modified": "2025-07-18T05:16:18.852035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_5_Sh_sho1_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "e1140c01-062c-46eb-9ea5-ba6cc864651d",
    "name": "7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "type": "file",
    "size": "377.08 KB",
    "modified": "2025-07-18T05:16:18.855035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_7_Sh_shoa_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "3aba5c45-d766-427c-9248-45359df35a7d",
    "name": "7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "type": "file",
    "size": "2.01 MB",
    "modified": "2025-07-18T05:16:18.842035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_24_Pl_Moln_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "59600170-65ec-4e31-b561-32bd1bddd830",
    "name": "7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "type": "file",
    "size": "323.02 KB",
    "modified": "2025-07-18T05:16:18.854035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_6_Sh_sho2_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "a22042b7-7af9-4022-8197-1d0ff0950736",
    "name": "7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "type": "file",
    "size": "190.98 KB",
    "modified": "2025-07-18T05:16:18.849035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_2_Sh_vru-1_3_А2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "1030acb0-33c5-45af-b6d7-e391bdf2fac6",
    "name": "7886-1.3-EOM_25_SUP_A2.dwg",
    "type": "file",
    "size": "334.59 KB",
    "modified": "2025-07-18T05:16:18.844035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-1.3-EOM/7886-1.3-EOM/DWG/7886-1.3-EOM_25_SUP_A2.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "79264bff-bdbe-4ab1-a92f-694dd1008a6f"
  },
  {
    "id": "6b1619ed-1eb7-4f3c-ac2e-d2eec63606f4",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:18.863035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d7474074-e19f-4795-af26-3cd049081b4f"
  },
  {
    "id": "f19a9150-89f5-419c-bc9f-7229551e641c",
    "name": "7886-10-EOM1",
    "type": "folder",
    "size": "10.47 MB",
    "modified": "2025-07-18T05:16:18.871035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6b1619ed-1eb7-4f3c-ac2e-d2eec63606f4"
  },
  {
    "id": "f474ad36-aabf-4682-8b09-fc41a9ad22ab",
    "name": "7886-10-EOM1.pdf",
    "type": "file",
    "size": "2.21 MB",
    "modified": "2025-07-18T05:16:18.869035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/7886-10-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f19a9150-89f5-419c-bc9f-7229551e641c"
  },
  {
    "id": "64bd3a96-913f-4db3-90de-f707fd2c701f",
    "name": "DWG",
    "type": "folder",
    "size": "8.26 MB",
    "modified": "2025-07-18T05:16:18.901036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f19a9150-89f5-419c-bc9f-7229551e641c"
  },
  {
    "id": "a90b34dc-735c-479f-bace-ab60dffe3496",
    "name": "7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "type": "file",
    "size": "222.82 KB",
    "modified": "2025-07-18T05:16:18.877035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_02_sh_VRU10_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "f406559c-1bb8-44e3-b7c8-cd661ecbe809",
    "name": "7886-10-EOM1_SO.pdf",
    "type": "file",
    "size": "138.97 KB",
    "modified": "2025-07-18T05:16:18.901036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "7ba63e95-38b7-4713-9696-99951c482486",
    "name": "7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "362.80 KB",
    "modified": "2025-07-18T05:16:18.900036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_9_osv_pl_+4,300, +6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "5754bae2-7723-48f0-b511-84246731d1f2",
    "name": "7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "type": "file",
    "size": "575.92 KB",
    "modified": "2025-07-18T05:16:18.892035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_11_lotok_pl_+4,300_+6,650,+10,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "97e2825a-4153-42d4-b159-ddd451b3ed90",
    "name": "7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "type": "file",
    "size": "216.50 KB",
    "modified": "2025-07-18T05:16:18.881035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_04_sh_SHV-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "c115f39e-27d7-4c3b-adb0-6a6f43571798",
    "name": "7886-10-EOM1_SO.xls",
    "type": "file",
    "size": "925.00 KB",
    "modified": "2025-07-18T05:16:18.903036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_SO.xls",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "c6ba14f4-2341-4936-80e5-20e122f33750",
    "name": "7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "type": "file",
    "size": "249.44 KB",
    "modified": "2025-07-18T05:16:18.875035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_01_ob_dan_A2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "f2a4ed7d-db15-4a3d-972d-67e5e8535a2e",
    "name": "7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "type": "file",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:18.896036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_12_molniez_zazem_pl_А1_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "05790c14-6976-46f6-9ebe-9e412b060778",
    "name": "7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "1019.38 KB",
    "modified": "2025-07-18T05:16:18.888036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_08_osv_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "cad2ca4a-7ca7-4750-89b1-d8e1d33894b3",
    "name": "7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "636.42 KB",
    "modified": "2025-07-18T05:16:18.890035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_10_lotok_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "e1d4532e-d502-4cfa-813b-97000edbb055",
    "name": "7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "type": "file",
    "size": "174.90 KB",
    "modified": "2025-07-18T05:16:18.898036Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_13_Scheme_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "8047c5e3-e896-4c7b-835a-2ce951e89cef",
    "name": "7886-10-EOM1_000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "84.26 KB",
    "modified": "2025-07-18T05:16:18.872035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "719b3b84-b91f-4054-9c44-6352ef9aba1f",
    "name": "7886-10-EOM1_00_Titulniy_A1.dwg",
    "type": "file",
    "size": "131.68 KB",
    "modified": "2025-07-18T05:16:18.874035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_00_Titulniy_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "d6613d4b-b0ed-41fc-acf7-9d5b5a6b266b",
    "name": "7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "type": "file",
    "size": "506.06 KB",
    "modified": "2025-07-18T05:16:18.883035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_06_sila_pl_0,000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "f69b4734-1d1e-402e-9b83-8a64b0ec4463",
    "name": "7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "type": "file",
    "size": "208.71 KB",
    "modified": "2025-07-18T05:16:18.882035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_05_sh_SHOA-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "8fff6508-aa1e-4245-ad44-d559699951b3",
    "name": "7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "type": "file",
    "size": "204.20 KB",
    "modified": "2025-07-18T05:16:18.879035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_03_sh_SHR-1_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "cfcb4e6f-a8a0-4ea4-b58d-7225aa0c9571",
    "name": "7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "type": "file",
    "size": "507.46 KB",
    "modified": "2025-07-18T05:16:18.886035Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ЭОМ разделы (КАЗГОР)/7886-10-EOM1/7886-10-EOM1/DWG/7886-10-EOM1_07_sila_pl_+4300_+6650_+10000_А2_RevА.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64bd3a96-913f-4db3-90de-f707fd2c701f"
  },
  {
    "id": "be2eacbf-27d6-485e-8cb1-f9456922155f",
    "name": "ОВ",
    "type": "folder",
    "size": "13.25 MB",
    "modified": "2025-07-18T05:16:18.398026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "04c1f257-076e-46ae-b8a3-f394e1538551",
    "name": "7886-4-OV",
    "type": "folder",
    "size": "555.79 KB",
    "modified": "2025-07-18T05:16:18.391026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-4-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "b73151a4-e58c-4d3f-85c4-370be1373651",
    "name": "7886-4-OV.pdf",
    "type": "file",
    "size": "555.79 KB",
    "modified": "2025-07-18T05:16:18.392026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-4-OV/7886-4-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "04c1f257-076e-46ae-b8a3-f394e1538551"
  },
  {
    "id": "09faf71d-b544-4dcb-9c63-ea0e6efbb445",
    "name": "7886-1.2-OV ",
    "type": "folder",
    "size": "7.30 MB",
    "modified": "2025-07-18T05:16:18.368026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-1.2-OV /",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "2a700213-86a5-4435-b738-65ab2331fa8a",
    "name": "7886-1.2-OV.pdf",
    "type": "file",
    "size": "7.30 MB",
    "modified": "2025-07-18T05:16:18.374026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-1.2-OV /7886-1.2-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "09faf71d-b544-4dcb-9c63-ea0e6efbb445"
  },
  {
    "id": "ce981395-3836-45cf-b3ae-f9648dd00140",
    "name": "7886-3-OV ",
    "type": "folder",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:18.386026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-3-OV /",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "9ddb9911-1fa4-44d8-8a1a-c988b9871811",
    "name": "7886-3-OV.pdf",
    "type": "file",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:18.388026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-3-OV /7886-3-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ce981395-3836-45cf-b3ae-f9648dd00140"
  },
  {
    "id": "f759efbc-580c-467e-a302-cdb465136457",
    "name": "7886-7.1-OV",
    "type": "folder",
    "size": "235.92 KB",
    "modified": "2025-07-18T05:16:18.396026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-7.1-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "a91f849c-848a-4159-b3e9-2e19f82b8d96",
    "name": "7886-7.1-OV.pdf",
    "type": "file",
    "size": "235.92 KB",
    "modified": "2025-07-18T05:16:18.397027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-7.1-OV/7886-7.1-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f759efbc-580c-467e-a302-cdb465136457"
  },
  {
    "id": "1aed425f-4d1a-46e3-8a3b-878fbbb521e1",
    "name": "7886-5-OV",
    "type": "folder",
    "size": "379.03 KB",
    "modified": "2025-07-18T05:16:18.394026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-5-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "6a100fd8-70b3-485f-97e3-ba175a4e4498",
    "name": "7886-5-OV.pdf",
    "type": "file",
    "size": "379.03 KB",
    "modified": "2025-07-18T05:16:18.394026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-5-OV/7886-5-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1aed425f-4d1a-46e3-8a3b-878fbbb521e1"
  },
  {
    "id": "02bc7ad6-3c6d-4189-b9f0-f9b715aeeddf",
    "name": "7886-1.3-OV ",
    "type": "folder",
    "size": "2.12 MB",
    "modified": "2025-07-18T05:16:18.380026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-1.3-OV /",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "e65b4262-3720-4cf7-b76d-d11f5ef746a8",
    "name": "7886-1.3-OV.pdf",
    "type": "file",
    "size": "2.12 MB",
    "modified": "2025-07-18T05:16:18.383026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-1.3-OV /7886-1.3-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "02bc7ad6-3c6d-4189-b9f0-f9b715aeeddf"
  },
  {
    "id": "e0d2f5e8-a4f6-4736-af0c-2dedf4b40dd3",
    "name": "7886-8.1-OV",
    "type": "folder",
    "size": "448.25 KB",
    "modified": "2025-07-18T05:16:18.398026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-8.1-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "be2eacbf-27d6-485e-8cb1-f9456922155f"
  },
  {
    "id": "fe36f96c-de7d-4a70-a634-99cdb47cafe9",
    "name": "7886-8.1-OV.pdf",
    "type": "file",
    "size": "448.25 KB",
    "modified": "2025-07-18T05:16:18.399026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ОВ/7886-8.1-OV/7886-8.1-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e0d2f5e8-a4f6-4736-af0c-2dedf4b40dd3"
  },
  {
    "id": "afc10f65-0314-47eb-913b-652fb854062a",
    "name": "AS-AC-Архитектурно строительные решения (Ограждение)",
    "type": "folder",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:18.152022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/AS-AC-Архитектурно строительные решения (Ограждение)/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "8172ef10-738c-4d86-8ce7-6b4071ad6258",
    "name": "7886-18-AS",
    "type": "folder",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:18.153022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/AS-AC-Архитектурно строительные решения (Ограждение)/7886-18-AS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "afc10f65-0314-47eb-913b-652fb854062a"
  },
  {
    "id": "160322a7-c041-4c14-a780-0d60aea95325",
    "name": "7886-18-AS_Ograzhdenie_RevAN2.pdf",
    "type": "file",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:18.155022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/AS-AC-Архитектурно строительные решения (Ограждение)/7886-18-AS/7886-18-AS_Ograzhdenie_RevAN2.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8172ef10-738c-4d86-8ce7-6b4071ad6258"
  },
  {
    "id": "7abb89e7-0962-4daf-aff6-69563c405bcf",
    "name": "Тех.задание",
    "type": "folder",
    "size": "4.35 MB",
    "modified": "2025-07-18T05:16:18.596030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Тех.задание/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "a90d8797-93a5-437c-8364-ffd8319e3aa9",
    "name": "Тех.задание.pdf",
    "type": "file",
    "size": "4.35 MB",
    "modified": "2025-07-18T05:16:18.602030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Тех.задание/Тех.задание.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7abb89e7-0962-4daf-aff6-69563c405bcf"
  },
  {
    "id": "541698b5-259c-4149-826c-96a20fea8d04",
    "name": "ТУ",
    "type": "folder",
    "size": "38.99 KB",
    "modified": "2025-07-18T05:16:18.594030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ТУ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "29990ece-8b03-4031-afd4-dee5a3c07085",
    "name": "НАК-ТЗ-ПепсоКО-3.docx",
    "type": "file",
    "size": "38.99 KB",
    "modified": "2025-07-18T05:16:18.594030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ТУ/НАК-ТЗ-ПепсоКО-3.docx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "541698b5-259c-4149-826c-96a20fea8d04"
  },
  {
    "id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3",
    "name": "АПТиА-Автоматическое пожаротушение",
    "type": "folder",
    "size": "5.03 MB",
    "modified": "2025-07-18T05:16:18.189023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "352dc622-f626-4eff-b90a-c332f546e1e7",
    "name": "7886-1.1-APTiA",
    "type": "folder",
    "size": "1.35 MB",
    "modified": "2025-07-18T05:16:18.171022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.1-APTiA/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3"
  },
  {
    "id": "4a08f51a-f5e8-441f-aa3b-bdfa522912c6",
    "name": "7886-1.1-APTiA.pdf",
    "type": "file",
    "size": "1.35 MB",
    "modified": "2025-07-18T05:16:18.174022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.1-APTiA/7886-1.1-APTiA.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "352dc622-f626-4eff-b90a-c332f546e1e7"
  },
  {
    "id": "1d90cf5e-d36f-4a18-a071-5e9af04f8095",
    "name": "7886-1.3-APTiA",
    "type": "folder",
    "size": "942.97 KB",
    "modified": "2025-07-18T05:16:18.182023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.3-APTiA/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3"
  },
  {
    "id": "5adc22c9-5beb-43be-94d2-0dafe7d6f0a2",
    "name": "7886-1.3-APTiA.pdf",
    "type": "file",
    "size": "942.97 KB",
    "modified": "2025-07-18T05:16:18.184022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.3-APTiA/7886-1.3-APTiA.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1d90cf5e-d36f-4a18-a071-5e9af04f8095"
  },
  {
    "id": "ed64a3f8-3685-4043-95ed-bb21ddadc32d",
    "name": "7886-8-APTiA",
    "type": "folder",
    "size": "985.87 KB",
    "modified": "2025-07-18T05:16:18.190023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-8-APTiA/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3"
  },
  {
    "id": "eb866565-dc7e-48f5-b83d-165caf2c83fa",
    "name": "7886-8-APTiA.pdf",
    "type": "file",
    "size": "985.87 KB",
    "modified": "2025-07-18T05:16:18.191023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-8-APTiA/7886-8-APTiA.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ed64a3f8-3685-4043-95ed-bb21ddadc32d"
  },
  {
    "id": "fc0995db-e9e6-471c-b52c-4d4fab16d91b",
    "name": "7886-1.2-APTiA",
    "type": "folder",
    "size": "1.09 MB",
    "modified": "2025-07-18T05:16:18.177022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.2-APTiA/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3"
  },
  {
    "id": "0d8e97e5-49be-4294-805d-e27a2e30cd24",
    "name": "7886-1.2-APTiA.pdf",
    "type": "file",
    "size": "1.09 MB",
    "modified": "2025-07-18T05:16:18.179022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-1.2-APTiA/7886-1.2-APTiA.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fc0995db-e9e6-471c-b52c-4d4fab16d91b"
  },
  {
    "id": "d17030c8-b32f-46b8-8062-0d39863f2576",
    "name": "7886-3-APTiA",
    "type": "folder",
    "size": "733.09 KB",
    "modified": "2025-07-18T05:16:18.186023Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-3-APTiA/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f95bdc59-aeb9-47aa-b8ec-32db63144be3"
  },
  {
    "id": "622acfea-8c17-42f3-944c-e0b80a8a75ec",
    "name": "7886-3-APTiA.pdf",
    "type": "file",
    "size": "733.09 KB",
    "modified": "2025-07-18T05:16:18.187022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/АПТиА-Автоматическое пожаротушение/7886-3-APTiA/7886-3-APTiA.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d17030c8-b32f-46b8-8062-0d39863f2576"
  },
  {
    "id": "5e6b0a46-bacb-42c8-8b4c-4922d3324b17",
    "name": "МГН",
    "type": "folder",
    "size": "19.97 MB",
    "modified": "2025-07-18T05:16:18.320025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "e8afe7f4-3ca7-4aa1-826f-2e650bb4ddce",
    "name": "МГН 1.2 только",
    "type": "folder",
    "size": "19.97 MB",
    "modified": "2025-07-18T05:16:18.347025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5e6b0a46-bacb-42c8-8b4c-4922d3324b17"
  },
  {
    "id": "dd88421d-16a4-475b-bef2-78bd9cbd6821",
    "name": "7886-1.2-MGN.pdf",
    "type": "file",
    "size": "8.07 MB",
    "modified": "2025-07-18T05:16:18.360026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e8afe7f4-3ca7-4aa1-826f-2e650bb4ddce"
  },
  {
    "id": "1e07aeed-c35d-4bfd-96a3-662733f233aa",
    "name": "7886-1.2-MGN",
    "type": "folder",
    "size": "11.90 MB",
    "modified": "2025-07-18T05:16:18.333025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e8afe7f4-3ca7-4aa1-826f-2e650bb4ddce"
  },
  {
    "id": "3e7eca2b-af6a-4dca-aa56-5a1ab98a0fda",
    "name": "7886-1.2-MGN.pdf",
    "type": "file",
    "size": "8.07 MB",
    "modified": "2025-07-18T05:16:18.329025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/7886-1.2-MGN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1e07aeed-c35d-4bfd-96a3-662733f233aa"
  },
  {
    "id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f",
    "name": "DWG",
    "type": "folder",
    "size": "3.83 MB",
    "modified": "2025-07-18T05:16:18.343025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1e07aeed-c35d-4bfd-96a3-662733f233aa"
  },
  {
    "id": "d751d4c5-140a-4a9e-b1c3-2fb023d18bee",
    "name": "7886-1.2-AR_0000000_Oblozhka_A1.dwg",
    "type": "file",
    "size": "110.75 KB",
    "modified": "2025-07-18T05:16:18.337025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.2-AR_0000000_Oblozhka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "ad690655-0476-47a6-81bb-e2b995569768",
    "name": "7886-1.1-AR_00000000_Titulka_A1.dwg",
    "type": "file",
    "size": "107.53 KB",
    "modified": "2025-07-18T05:16:18.335025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.1-AR_00000000_Titulka_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "e1d78ecc-62c9-4ed6-b343-8e2f324732b2",
    "name": "7886-1.2-AR_3_Plan+0000_MGN_A1.dwg",
    "type": "file",
    "size": "2.49 MB",
    "modified": "2025-07-18T05:16:18.345026Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.2-AR_3_Plan+0000_MGN_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "0eb34fb3-2bf9-47a5-b5a4-a7aeec36dc53",
    "name": "7886-1.2-AR_1_Obschie_Dannye_MGN_A1.dwg",
    "type": "file",
    "size": "394.94 KB",
    "modified": "2025-07-18T05:16:18.341025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.2-AR_1_Obschie_Dannye_MGN_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "162f0644-babe-47af-ad3d-b59a5ba5c7f9",
    "name": "7886-1.2-AR_10_.dwg",
    "type": "file",
    "size": "383.62 KB",
    "modified": "2025-07-18T05:16:18.339025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.2-AR_10_.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "f2bc0514-5581-4247-94d2-6cd68a5e67cc",
    "name": "7886-1.1-AR_1_Obschie_Dannye_MGN_A1.dwg",
    "type": "file",
    "size": "378.19 KB",
    "modified": "2025-07-18T05:16:18.336025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/МГН/МГН 1.2 только/7886-1.2-MGN/DWG/7886-1.1-AR_1_Obschie_Dannye_MGN_A1.dwg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "eecf70a2-a9c7-431d-945d-3f2fa1e6776f"
  },
  {
    "id": "a6464ab7-7535-47a7-947f-85efde9179f4",
    "name": "TM-ТМ-Тепломеханические решения",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:18.161022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/TM-ТМ-Тепломеханические решения/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "c97a6a93-1f7c-4aad-9af8-f6b9979f94fe",
    "name": "7886-3-TM",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:18.163022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/TM-ТМ-Тепломеханические решения/7886-3-TM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "a6464ab7-7535-47a7-947f-85efde9179f4"
  },
  {
    "id": "704e1743-8023-4759-9d86-d99c09d28ebd",
    "name": "7886-3-TM.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:18.166022Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/TM-ТМ-Тепломеханические решения/7886-3-TM/7886-3-TM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c97a6a93-1f7c-4aad-9af8-f6b9979f94fe"
  },
  {
    "id": "f0115e06-9337-495c-92bf-981f47adf5b4",
    "name": "Слаботочные разделы (КАЗГОР) ",
    "type": "folder",
    "size": "79.67 MB",
    "modified": "2025-07-18T05:16:18.580030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "321f0496-ac2a-45e7-89cb-1b0f977d9ecd",
    "name": "AGPT-АГПТ-Автоматическое газовое пожаротушения",
    "type": "folder",
    "size": "26.12 MB",
    "modified": "2025-07-18T05:16:18.439027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f0115e06-9337-495c-92bf-981f47adf5b4"
  },
  {
    "id": "9fb2b7ee-d9f7-4f91-a8f0-c2c006dee343",
    "name": "7886-1.3-AGPT",
    "type": "folder",
    "size": "7.98 MB",
    "modified": "2025-07-18T05:16:18.452027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.3-AGPT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "321f0496-ac2a-45e7-89cb-1b0f977d9ecd"
  },
  {
    "id": "72a648e3-dffd-464d-9e54-03dc965c974e",
    "name": "7886-1.3-AGPT.pdf",
    "type": "file",
    "size": "1.13 MB",
    "modified": "2025-07-18T05:16:18.453027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.3-AGPT/7886-1.3-AGPT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9fb2b7ee-d9f7-4f91-a8f0-c2c006dee343"
  },
  {
    "id": "b0b4ac6e-4c19-4e62-b04a-9e30138e64a5",
    "name": "7886-1.3-AGPT.DWG",
    "type": "file",
    "size": "6.85 MB",
    "modified": "2025-07-18T05:16:18.447027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.3-AGPT/7886-1.3-AGPT.DWG",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9fb2b7ee-d9f7-4f91-a8f0-c2c006dee343"
  },
  {
    "id": "42ff201c-7e62-470e-a308-6d922bc9f08b",
    "name": "7886-1.2-AGPT",
    "type": "folder",
    "size": "10.39 MB",
    "modified": "2025-07-18T05:16:18.435027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.2-AGPT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "321f0496-ac2a-45e7-89cb-1b0f977d9ecd"
  },
  {
    "id": "949405e7-f1e0-47e5-953b-55b61cbe24fa",
    "name": "7886-1.2-AGPT.DWG",
    "type": "file",
    "size": "8.51 MB",
    "modified": "2025-07-18T05:16:18.431027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.2-AGPT/7886-1.2-AGPT.DWG",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "42ff201c-7e62-470e-a308-6d922bc9f08b"
  },
  {
    "id": "fd7ea49c-d869-4d07-836d-b0103f0a6ac4",
    "name": "7886-1.2-AGPT.pdf",
    "type": "file",
    "size": "1.87 MB",
    "modified": "2025-07-18T05:16:18.437027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.2-AGPT/7886-1.2-AGPT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "42ff201c-7e62-470e-a308-6d922bc9f08b"
  },
  {
    "id": "cbe0fe2a-d6f9-4183-a36f-b83a9fdfe8eb",
    "name": "7886-1.1-AGPT",
    "type": "folder",
    "size": "7.75 MB",
    "modified": "2025-07-18T05:16:18.414027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.1-AGPT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "321f0496-ac2a-45e7-89cb-1b0f977d9ecd"
  },
  {
    "id": "00dd0955-33b8-447d-bae9-a3e6ebe5a4f6",
    "name": "7886-1.1-AGPT.DWG",
    "type": "file",
    "size": "6.83 MB",
    "modified": "2025-07-18T05:16:18.410027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.1-AGPT/7886-1.1-AGPT.DWG",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cbe0fe2a-d6f9-4183-a36f-b83a9fdfe8eb"
  },
  {
    "id": "b66769a7-8034-4338-8b17-09a2462866a3",
    "name": "7886-1.1-AGPT.pdf",
    "type": "file",
    "size": "939.77 KB",
    "modified": "2025-07-18T05:16:18.415027Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.1-AGPT/7886-1.1-AGPT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cbe0fe2a-d6f9-4183-a36f-b83a9fdfe8eb"
  },
  {
    "id": "3208e36f-cea2-4022-9991-d27316100c79",
    "name": "SS-СС-Системы связи",
    "type": "folder",
    "size": "36.63 MB",
    "modified": "2025-07-18T05:16:18.575030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f0115e06-9337-495c-92bf-981f47adf5b4"
  },
  {
    "id": "d1bb402a-3861-4c72-bff5-574650362882",
    "name": "7886-1.2-SS",
    "type": "folder",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:18.516029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.2-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "2f38aede-4b44-4fa0-82ad-a4fca4d0ca4a",
    "name": "7886-1.2-SS_RevAN.pdf",
    "type": "file",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:18.528029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.2-SS/7886-1.2-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d1bb402a-3861-4c72-bff5-574650362882"
  },
  {
    "id": "d83e42f7-93d5-44a5-9027-9cf14c0d401e",
    "name": "7886-7-SS",
    "type": "folder",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:18.576030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-7-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "6f0d520d-71d5-48c3-a539-dcd03fb197e1",
    "name": "7886-7-SS_RevAN.pdf",
    "type": "file",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:18.578030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-7-SS/7886-7-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d83e42f7-93d5-44a5-9027-9cf14c0d401e"
  },
  {
    "id": "71bb3360-8782-4e8a-b653-95eee2ec6ba2",
    "name": "7886-1.1-SS_AN",
    "type": "folder",
    "size": "7.75 MB",
    "modified": "2025-07-18T05:16:18.501028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.1-SS_AN/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "a21742dc-7226-43f2-8f40-692a42a92d3e",
    "name": "7886-1.1-SS_AN.pdf",
    "type": "file",
    "size": "7.75 MB",
    "modified": "2025-07-18T05:16:18.509028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.1-SS_AN/7886-1.1-SS_AN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "71bb3360-8782-4e8a-b653-95eee2ec6ba2"
  },
  {
    "id": "ab0ba294-0706-4a0d-bd1f-75f8ad2e7bc6",
    "name": "7886-3-SS",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:18.557029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "296d7652-6de3-4574-88ad-163bf49c95e7",
    "name": "7886-3-SS.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:18.560030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-3-SS/7886-3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ab0ba294-0706-4a0d-bd1f-75f8ad2e7bc6"
  },
  {
    "id": "e999402a-060d-4130-a589-a34728fd84bf",
    "name": "7886-1.3-SS",
    "type": "folder",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:18.538029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "827988fc-037b-4e4e-8454-49b06038ba09",
    "name": "7886-1.3-SS.pdf",
    "type": "file",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:18.546029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-1.3-SS/7886-1.3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e999402a-060d-4130-a589-a34728fd84bf"
  },
  {
    "id": "111b3348-16be-463d-952f-b16c6033bcf1",
    "name": "7886-4-SS",
    "type": "folder",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:18.562029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-4-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "0d89f7cd-09d0-4ab6-b042-e354562ff442",
    "name": "7886-4-SS.pdf",
    "type": "file",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:18.566030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-4-SS/7886-4-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "111b3348-16be-463d-952f-b16c6033bcf1"
  },
  {
    "id": "e97cc261-a288-4c0b-8231-5e6cea50e420",
    "name": "7886-10-SS",
    "type": "folder",
    "size": "1.81 MB",
    "modified": "2025-07-18T05:16:18.551029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-10-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "c99d2379-df19-481f-8671-3960215dd9c1",
    "name": "7886-10-SS_RevAN.pdf",
    "type": "file",
    "size": "1.81 MB",
    "modified": "2025-07-18T05:16:18.554029Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-10-SS/7886-10-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e97cc261-a288-4c0b-8231-5e6cea50e420"
  },
  {
    "id": "f9adaf92-b77d-445b-be65-6a0a14217035",
    "name": "7886-5-SS",
    "type": "folder",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:18.569030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-5-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3208e36f-cea2-4022-9991-d27316100c79"
  },
  {
    "id": "87f0238f-c6f1-4a22-9095-42c2aef9f2df",
    "name": "7886-5-SS.pdf",
    "type": "file",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:18.573030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /SS-СС-Системы связи/7886-5-SS/7886-5-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f9adaf92-b77d-445b-be65-6a0a14217035"
  },
  {
    "id": "fe49be1d-ab4f-448f-a3a7-374408f91edd",
    "name": "РО-Речевое оповещение",
    "type": "folder",
    "size": "2.97 MB",
    "modified": "2025-07-18T05:16:18.589030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f0115e06-9337-495c-92bf-981f47adf5b4"
  },
  {
    "id": "d998e9d0-bbb2-4a92-8ab2-8e3e6e68f175",
    "name": "7886-1.1-RO",
    "type": "folder",
    "size": "868.56 KB",
    "modified": "2025-07-18T05:16:18.582030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.1-RO/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fe49be1d-ab4f-448f-a3a7-374408f91edd"
  },
  {
    "id": "a590fd73-0e0b-4e47-be14-e7ac58ad7dda",
    "name": "7886-1.1-RO.pdf",
    "type": "file",
    "size": "868.56 KB",
    "modified": "2025-07-18T05:16:18.583030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.1-RO/7886-1.1-RO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d998e9d0-bbb2-4a92-8ab2-8e3e6e68f175"
  },
  {
    "id": "b2ba0a1d-4e39-4feb-a4d5-3adc0d2b9445",
    "name": "7886-1.2-RO",
    "type": "folder",
    "size": "1.48 MB",
    "modified": "2025-07-18T05:16:18.585030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.2-RO/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fe49be1d-ab4f-448f-a3a7-374408f91edd"
  },
  {
    "id": "e5d7f4dd-4d6a-4a35-a8e9-488b3f4822c7",
    "name": "7886-1.2-RO.pdf",
    "type": "file",
    "size": "1.48 MB",
    "modified": "2025-07-18T05:16:18.587030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.2-RO/7886-1.2-RO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b2ba0a1d-4e39-4feb-a4d5-3adc0d2b9445"
  },
  {
    "id": "c848f522-910c-4a51-aa3e-7de169aa2ff1",
    "name": "7886-1.3-RO",
    "type": "folder",
    "size": "652.64 KB",
    "modified": "2025-07-18T05:16:18.589030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.3-RO/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fe49be1d-ab4f-448f-a3a7-374408f91edd"
  },
  {
    "id": "54b1b03b-14d6-4709-9566-f3380ef275ad",
    "name": "7886-1.3-RO.pdf",
    "type": "file",
    "size": "652.64 KB",
    "modified": "2025-07-18T05:16:18.590030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /РО-Речевое оповещение/7886-1.3-RO/7886-1.3-RO.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c848f522-910c-4a51-aa3e-7de169aa2ff1"
  },
  {
    "id": "412e950b-8979-4298-8b72-18e8eb9fbef3",
    "name": "PS-ПС-Пожарная сигнализация",
    "type": "folder",
    "size": "13.95 MB",
    "modified": "2025-07-18T05:16:18.496028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f0115e06-9337-495c-92bf-981f47adf5b4"
  },
  {
    "id": "2a7725fa-3f17-4c81-ad63-86a0bb5f0ba3",
    "name": "7886-7-PS",
    "type": "folder",
    "size": "807.36 KB",
    "modified": "2025-07-18T05:16:18.494028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-7-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "974d77c5-d035-4324-9040-d54e4e954e4e",
    "name": "7886-7-PS_RevAN.pdf",
    "type": "file",
    "size": "807.36 KB",
    "modified": "2025-07-18T05:16:18.495028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-7-PS/7886-7-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2a7725fa-3f17-4c81-ad63-86a0bb5f0ba3"
  },
  {
    "id": "3bc7b541-eecd-4b73-a5fa-a238083f2334",
    "name": "7886-10-PS",
    "type": "folder",
    "size": "938.02 KB",
    "modified": "2025-07-18T05:16:18.476028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-10-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "a708c9b7-2985-41b5-888d-1852708f9942",
    "name": "7886-10-PS.pdf",
    "type": "file",
    "size": "938.02 KB",
    "modified": "2025-07-18T05:16:18.477028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-10-PS/7886-10-PS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3bc7b541-eecd-4b73-a5fa-a238083f2334"
  },
  {
    "id": "9acae90e-6acd-4c89-af90-2f2c183d2c4a",
    "name": "7886-8.1-PS",
    "type": "folder",
    "size": "765.99 KB",
    "modified": "2025-07-18T05:16:18.497028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-8.1-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "74b72547-d57f-4f56-b056-763b5feff06c",
    "name": "7886-8.1-PS_RevAN.pdf",
    "type": "file",
    "size": "765.99 KB",
    "modified": "2025-07-18T05:16:18.498028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-8.1-PS/7886-8.1-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9acae90e-6acd-4c89-af90-2f2c183d2c4a"
  },
  {
    "id": "92b112ab-35c3-448e-9d10-606e0e5399d1",
    "name": "7886-5-PS",
    "type": "folder",
    "size": "758.34 KB",
    "modified": "2025-07-18T05:16:18.490028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-5-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "3788876f-1173-4130-af11-6d75ebedcba9",
    "name": "7886-5-PS.pdf",
    "type": "file",
    "size": "758.34 KB",
    "modified": "2025-07-18T05:16:18.491028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-5-PS/7886-5-PS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "92b112ab-35c3-448e-9d10-606e0e5399d1"
  },
  {
    "id": "4828b53a-c51a-4b43-9c6b-f1e6d4d5a36b",
    "name": "7886-11-12-PS",
    "type": "folder",
    "size": "1021.18 KB",
    "modified": "2025-07-18T05:16:18.480028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-11-12-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "6c0a8feb-8734-45ee-b860-6b414f99ca2b",
    "name": "7886-11-12-PS_RevAN.pdf",
    "type": "file",
    "size": "1021.18 KB",
    "modified": "2025-07-18T05:16:18.481028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-11-12-PS/7886-11-12-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4828b53a-c51a-4b43-9c6b-f1e6d4d5a36b"
  },
  {
    "id": "beb3d986-f703-4363-a297-9ef323971d8c",
    "name": "7886-3-PS",
    "type": "folder",
    "size": "1.11 MB",
    "modified": "2025-07-18T05:16:18.483028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-3-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "901ee68a-ef55-4e51-b4cc-6a6d457c1192",
    "name": "7886-3-PS.pdf",
    "type": "file",
    "size": "1.11 MB",
    "modified": "2025-07-18T05:16:18.485028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-3-PS/7886-3-PS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "beb3d986-f703-4363-a297-9ef323971d8c"
  },
  {
    "id": "fed05983-e4c7-4fc2-9109-939f71c74931",
    "name": "7886-1.1-PS",
    "type": "folder",
    "size": "3.64 MB",
    "modified": "2025-07-18T05:16:18.456028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.1-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "27eeb9de-6674-4ccf-9226-6da015d0ba94",
    "name": "7886-1.1-PS_RevAN.pdf",
    "type": "file",
    "size": "3.64 MB",
    "modified": "2025-07-18T05:16:18.462028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.1-PS/7886-1.1-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fed05983-e4c7-4fc2-9109-939f71c74931"
  },
  {
    "id": "e81a98f3-e6fb-4869-87bb-cd9a976739e6",
    "name": "7886-1.3-PS",
    "type": "folder",
    "size": "2.00 MB",
    "modified": "2025-07-18T05:16:18.471028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.3-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "235c2394-d6e9-436e-a84d-e0ef8535b5d4",
    "name": "7886-1.3-PS_RevAN.pdf",
    "type": "file",
    "size": "2.00 MB",
    "modified": "2025-07-18T05:16:18.473028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.3-PS/7886-1.3-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e81a98f3-e6fb-4869-87bb-cd9a976739e6"
  },
  {
    "id": "a8d39f85-2308-417a-9931-2e815e9782f1",
    "name": "7886-1.2-PS",
    "type": "folder",
    "size": "2.06 MB",
    "modified": "2025-07-18T05:16:18.465028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.2-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "14a7c393-95bf-4016-b11e-3c165475e59d",
    "name": "7886-1.2-PS_RevAN.pdf",
    "type": "file",
    "size": "2.06 MB",
    "modified": "2025-07-18T05:16:18.468028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-1.2-PS/7886-1.2-PS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "a8d39f85-2308-417a-9931-2e815e9782f1"
  },
  {
    "id": "e01a1aa1-303b-42d5-ac0e-c1a458f361ef",
    "name": "7886-4-PS",
    "type": "folder",
    "size": "976.01 KB",
    "modified": "2025-07-18T05:16:18.487028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-4-PS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "412e950b-8979-4298-8b72-18e8eb9fbef3"
  },
  {
    "id": "fd4acf47-90c1-4c67-915a-6ee29f5aef03",
    "name": "7886-4-PS.pdf",
    "type": "file",
    "size": "976.01 KB",
    "modified": "2025-07-18T05:16:18.489028Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Слаботочные разделы (КАЗГОР) /PS-ПС-Пожарная сигнализация/7886-4-PS/7886-4-PS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e01a1aa1-303b-42d5-ac0e-c1a458f361ef"
  },
  {
    "id": "8cece373-082e-4819-af77-3dc7e4b1ba98",
    "name": "Спецификация",
    "type": "folder",
    "size": "43.11 KB",
    "modified": "2025-07-18T05:16:18.593030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Спецификация/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "22099809-074a-4c42-ad51-c09b11019fdd",
    "name": "АДУ Спецификация (1).xlsx",
    "type": "file",
    "size": "15.25 KB",
    "modified": "2025-07-18T05:16:18.593030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Спецификация/АДУ Спецификация (1).xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8cece373-082e-4819-af77-3dc7e4b1ba98"
  },
  {
    "id": "0343ed4e-6415-4bfe-b891-06b8d2dcfc9d",
    "name": "АГПТ Спецификация.xlsx",
    "type": "file",
    "size": "27.85 KB",
    "modified": "2025-07-18T05:16:18.592030Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/Спецификация/АГПТ Спецификация.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8cece373-082e-4819-af77-3dc7e4b1ba98"
  },
  {
    "id": "5f509594-fc27-4ea2-845d-28680c3fa8eb",
    "name": "ВК",
    "type": "folder",
    "size": "19.62 MB",
    "modified": "2025-07-18T05:16:18.312025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7d6767ba-dc95-4ea0-9cae-add2577d7d66"
  },
  {
    "id": "69b949b3-9ac6-42a8-a604-ccd6a040462f",
    "name": "7886-3-VK",
    "type": "folder",
    "size": "772.30 KB",
    "modified": "2025-07-18T05:16:18.294024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-3-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "974f57ab-f713-4ff9-9269-5e232efca5bc",
    "name": "7886-3-VK.pdf",
    "type": "file",
    "size": "772.30 KB",
    "modified": "2025-07-18T05:16:18.295025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-3-VK/7886-3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "69b949b3-9ac6-42a8-a604-ccd6a040462f"
  },
  {
    "id": "3615a8f5-4ada-4c1e-b8fe-a1dfa19ccd47",
    "name": "7886-7-VK",
    "type": "folder",
    "size": "2.98 MB",
    "modified": "2025-07-18T05:16:18.304025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-7-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "59318baa-1e80-49e5-8275-a0871db5f158",
    "name": "7886-7-VK_RevAN.pdf",
    "type": "file",
    "size": "2.98 MB",
    "modified": "2025-07-18T05:16:18.309025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-7-VK/7886-7-VK_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3615a8f5-4ada-4c1e-b8fe-a1dfa19ccd47"
  },
  {
    "id": "8826f2ec-af6a-4d37-8a73-59245a5582d9",
    "name": "7886-1.2-VK",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:18.266024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.2-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "ce470366-2b91-45c6-b59d-fc764a256eb1",
    "name": "7886-1.2-VK.pdf",
    "type": "file",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:18.273024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.2-VK/7886-1.2-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8826f2ec-af6a-4d37-8a73-59245a5582d9"
  },
  {
    "id": "b1b78073-ed03-477e-b183-a876320b1bee",
    "name": "7886-4-VK",
    "type": "folder",
    "size": "546.88 KB",
    "modified": "2025-07-18T05:16:18.298025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-4-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "63ea007f-0f6d-43df-881e-48c6dc884aeb",
    "name": "7886-4-VK.pdf",
    "type": "file",
    "size": "546.88 KB",
    "modified": "2025-07-18T05:16:18.299025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-4-VK/7886-4-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b1b78073-ed03-477e-b183-a876320b1bee"
  },
  {
    "id": "4eb83e0d-12ae-46de-88c0-e0b7897c042e",
    "name": "7886-5-VK",
    "type": "folder",
    "size": "488.90 KB",
    "modified": "2025-07-18T05:16:18.301025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-5-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "b4f18d1b-6f43-48ba-bf3b-c601b9c2ea61",
    "name": "7886-5-VK.pdf",
    "type": "file",
    "size": "488.90 KB",
    "modified": "2025-07-18T05:16:18.302025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-5-VK/7886-5-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4eb83e0d-12ae-46de-88c0-e0b7897c042e"
  },
  {
    "id": "2fbcf45d-f510-4426-b36a-8c703ff2d83c",
    "name": "7886-1.3-VK",
    "type": "folder",
    "size": "5.17 MB",
    "modified": "2025-07-18T05:16:18.283024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.3-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "5abebbca-da49-4bac-a620-ae958ffec5ce",
    "name": "7886-1.3-VK.pdf",
    "type": "file",
    "size": "5.17 MB",
    "modified": "2025-07-18T05:16:18.289024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.3-VK/7886-1.3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2fbcf45d-f510-4426-b36a-8c703ff2d83c"
  },
  {
    "id": "64928452-c5ed-4d93-9526-ef43a191f51d",
    "name": "7886-8-VK",
    "type": "folder",
    "size": "2.85 MB",
    "modified": "2025-07-18T05:16:18.313025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-8-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "c9987567-50c9-4d54-aea5-4ae9a05f6cd1",
    "name": "7886-8.1-8.2-8.3-VK.pdf",
    "type": "file",
    "size": "2.85 MB",
    "modified": "2025-07-18T05:16:18.317025Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-8-VK/7886-8.1-8.2-8.3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "64928452-c5ed-4d93-9526-ef43a191f51d"
  },
  {
    "id": "5c22a9d9-17fc-465d-a5ff-5bef4064866c",
    "name": "7886-1.2-VK.PT",
    "type": "folder",
    "size": "1.55 MB",
    "modified": "2025-07-18T05:16:18.278024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.2-VK.PT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5f509594-fc27-4ea2-845d-28680c3fa8eb"
  },
  {
    "id": "bacdc2f8-fef8-4cad-a211-8d32297c7f60",
    "name": "7886-1.2-VK.PT.pdf",
    "type": "file",
    "size": "1.55 MB",
    "modified": "2025-07-18T05:16:18.280024Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "1.Исх данные/ВК/7886-1.2-VK.PT/7886-1.2-VK.PT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "5c22a9d9-17fc-465d-a5ff-5bef4064866c"
  },
  {
    "id": "cf5fe52c-f86a-4560-99ad-f86be736a71e",
    "name": "4. Procurement",
    "type": "folder",
    "size": "420.15 MB",
    "modified": "2025-07-18T05:16:21.372081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/",
    "tags": [],
    "archived": false,
    "starred": false
  },
  {
    "id": "6687d08d-0bbc-4cd7-b755-e4111539c439",
    "name": "ТЭО_Legrand_GQ-Contract + СКС fin.docx",
    "type": "file",
    "size": "3.14 MB",
    "modified": "2025-07-18T05:16:21.369081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ТЭО_Legrand_GQ-Contract + СКС fin.docx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cf5fe52c-f86a-4560-99ad-f86be736a71e"
  },
  {
    "id": "331e30f2-baa3-438c-99b3-0712b74b3667",
    "name": "ТЭО_Legrand_GQ-Contract + СКС fin.pdf",
    "type": "file",
    "size": "1.67 MB",
    "modified": "2025-07-18T05:16:21.374081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ТЭО_Legrand_GQ-Contract + СКС fin.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cf5fe52c-f86a-4560-99ad-f86be736a71e"
  },
  {
    "id": "edc8f8e3-30e6-49d3-b23d-b6dea57de1c2",
    "name": "СВОД ПепсиКо 07.03.2025.xlsm",
    "type": "file",
    "size": "1.05 MB",
    "modified": "2025-07-18T05:16:21.357081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/СВОД ПепсиКо 07.03.2025.xlsm",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cf5fe52c-f86a-4560-99ad-f86be736a71e"
  },
  {
    "id": "40a7b7cd-591b-4922-b113-5212589589ee",
    "name": "Свод_Пепсико ЭОМ_общ.xlsx",
    "type": "file",
    "size": "1.46 MB",
    "modified": "2025-07-18T05:16:21.360081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/Свод_Пепсико ЭОМ_общ.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cf5fe52c-f86a-4560-99ad-f86be736a71e"
  },
  {
    "id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b",
    "name": "ПепсиКо Центральная Азия",
    "type": "folder",
    "size": "412.84 MB",
    "modified": "2025-07-18T05:16:21.352081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "cf5fe52c-f86a-4560-99ad-f86be736a71e"
  },
  {
    "id": "78c3edc6-12f1-48be-b6fa-c43e09b9dbcd",
    "name": "Свод Пепси HPE.xlsm",
    "type": "file",
    "size": "1011.42 KB",
    "modified": "2025-07-18T05:16:21.320080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод Пепси HPE.xlsm",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "6b8075b7-59cf-4603-9661-92a7bc48e2b5",
    "name": "СВОД_СС с ценами HPE.xlsx",
    "type": "file",
    "size": "255.05 KB",
    "modified": "2025-07-18T05:16:21.317080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/СВОД_СС с ценами HPE.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "a8754892-292c-42be-992a-0b9a95aa1a89",
    "name": "Пепсико спецификация по СС.xlsx",
    "type": "file",
    "size": "27.21 KB",
    "modified": "2025-07-18T05:16:21.308080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Пепсико спецификация по СС.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "54a1e7d1-4c13-4605-9338-4b4e2bdea265",
    "name": "Проценты для ГП для свода.xlsx",
    "type": "file",
    "size": "11.19 KB",
    "modified": "2025-07-18T05:16:21.311080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Проценты для ГП для свода.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "b42714cc-9169-4bf7-b562-7e870397fa5f",
    "name": "Свод_ПепсиКо СС.xlsx",
    "type": "file",
    "size": "224.96 KB",
    "modified": "2025-07-18T05:16:21.324080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод_ПепсиКо СС.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "27e05019-b4ac-4169-b0e6-2e80c08c96b4",
    "name": "Прайс от Электрокомплект.xlsx",
    "type": "file",
    "size": "367.71 KB",
    "modified": "2025-07-18T05:16:21.310080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Прайс от Электрокомплект.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "1674d3d8-f562-458b-ba89-9a09174f53db",
    "name": "Свод ПепсиКо_на Световые_Айнур 03.02.25.xlsx",
    "type": "file",
    "size": "56.40 KB",
    "modified": "2025-07-18T05:16:21.321080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод ПепсиКо_на Световые_Айнур 03.02.25.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "d707fb1e-1024-4746-b9de-91515411174e",
    "name": "Свод_Пепсико ЭОМ_общ.xlsx",
    "type": "file",
    "size": "1.46 MB",
    "modified": "2025-07-18T05:16:21.354081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод_Пепсико ЭОМ_общ.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "ab3acfd5-89ab-4d40-8551-f9368b9e6cc5",
    "name": "0708КП_ПепсиКО_НАШ_без_ндс 12%_ 04072024 (1).xlsx",
    "type": "file",
    "size": "2.45 MB",
    "modified": "2025-07-18T05:16:20.321062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/0708КП_ПепсиКО_НАШ_без_ндс 12%_ 04072024 (1).xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "e5020aa9-8d43-4653-beed-0d320cf73b01",
    "name": "Свод_ПепсиКо ЭОМ.xlsx",
    "type": "file",
    "size": "13.34 MB",
    "modified": "2025-07-18T05:16:21.345081Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод_ПепсиКо ЭОМ.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "10b10423-9990-4839-9613-5befa3728fa8",
    "name": "СВОД от Алматы на щиты",
    "type": "folder",
    "size": "908.20 KB",
    "modified": "2025-07-18T05:16:21.315080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/СВОД от Алматы на щиты/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "06baaead-51c3-4858-9aad-c96b9dadac82",
    "name": "Копия 0708КП_ПепсиКО_НАШ_без_ндс 12% 01.02.25.xlsx",
    "type": "file",
    "size": "232.29 KB",
    "modified": "2025-07-18T05:16:21.315080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/СВОД от Алматы на щиты/Копия 0708КП_ПепсиКО_НАШ_без_ндс 12% 01.02.25.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b10423-9990-4839-9613-5befa3728fa8"
  },
  {
    "id": "1e676079-8db4-42ce-ab3f-c70b99481714",
    "name": "0708КП_ПепсиКО_НАШ_без_ндс 12%_03.02.24 (производственный цех).xlsx",
    "type": "file",
    "size": "675.91 KB",
    "modified": "2025-07-18T05:16:21.314080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/СВОД от Алматы на щиты/0708КП_ПепсиКО_НАШ_без_ндс 12%_03.02.24 (производственный цех).xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "10b10423-9990-4839-9613-5befa3728fa8"
  },
  {
    "id": "629dddfa-20c5-4c8e-85d2-f4bc549b5068",
    "name": "КП на кабели",
    "type": "folder",
    "size": "323.32 KB",
    "modified": "2025-07-18T05:16:21.289079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на кабели/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "280738c6-a407-4d01-9815-e8622507b963",
    "name": "КП на кабели от БВС Алматы 31.01.2025.xlsx",
    "type": "file",
    "size": "40.82 KB",
    "modified": "2025-07-18T05:16:21.289079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на кабели/КП на кабели от БВС Алматы 31.01.2025.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "629dddfa-20c5-4c8e-85d2-f4bc549b5068"
  },
  {
    "id": "0a5296a9-a3c7-4daf-b6bc-feb9ce841fe9",
    "name": "БВБ Алматы БЦК (тг) 2035 от 27.01.2025.pdf",
    "type": "file",
    "size": "282.51 KB",
    "modified": "2025-07-18T05:16:21.289079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на кабели/БВБ Алматы БЦК (тг) 2035 от 27.01.2025.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "629dddfa-20c5-4c8e-85d2-f4bc549b5068"
  },
  {
    "id": "4352c628-65af-4fe3-9af6-80a309c12aaa",
    "name": "КП на шины",
    "type": "folder",
    "size": "420.51 KB",
    "modified": "2025-07-18T05:16:21.294080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на шины/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "515693f3-cb03-4173-b889-05d30e6ae764",
    "name": "ТКП № 77 от 20.09.2024г Пепсико Алюминий-signed.pdf",
    "type": "file",
    "size": "210.32 KB",
    "modified": "2025-07-18T05:16:21.293080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на шины/ТКП № 77 от 20.09.2024г Пепсико Алюминий-signed.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4352c628-65af-4fe3-9af6-80a309c12aaa"
  },
  {
    "id": "6954ab3a-234c-4f3c-98a3-adec3a211cef",
    "name": "ТКП № 78 от 20.09.2024г Пепсико Медь-signed.pdf",
    "type": "file",
    "size": "210.19 KB",
    "modified": "2025-07-18T05:16:21.294080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на шины/ТКП № 78 от 20.09.2024г Пепсико Медь-signed.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4352c628-65af-4fe3-9af6-80a309c12aaa"
  },
  {
    "id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d",
    "name": "SS-СС-Системы связи",
    "type": "folder",
    "size": "27.08 MB",
    "modified": "2025-07-18T05:16:21.150077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "62a9ba60-92b6-40b2-b703-047886925031",
    "name": "7886-1.2-SS",
    "type": "folder",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:21.099076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-1.2-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "63948963-8124-4f86-afce-1facb1925807",
    "name": "7886-1.2-SS_RevAN.pdf",
    "type": "file",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:21.112076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-1.2-SS/7886-1.2-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "62a9ba60-92b6-40b2-b703-047886925031"
  },
  {
    "id": "e9115fdf-089d-4d4d-bd15-14e0df13151a",
    "name": "7886-7-SS",
    "type": "folder",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:21.151077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-7-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "e827eb21-0021-4688-ac56-e0bce596a5c6",
    "name": "7886-7-SS_RevAN.pdf",
    "type": "file",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:21.154077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-7-SS/7886-7-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e9115fdf-089d-4d4d-bd15-14e0df13151a"
  },
  {
    "id": "159db612-4c09-4e88-ad3b-328bb2b1365d",
    "name": "7886-3-SS",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:21.130077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "fe771d12-1119-4804-aeaa-54402cd3aabc",
    "name": "7886-3-SS.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:21.133077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-3-SS/7886-3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "159db612-4c09-4e88-ad3b-328bb2b1365d"
  },
  {
    "id": "8263612c-c5cf-475f-878e-ca58eb83e403",
    "name": "7886-1.3-SS",
    "type": "folder",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:21.118076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-1.3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "8322f65e-0ad0-4f5d-8188-1295d8b9ef67",
    "name": "7886-1.3-SS.pdf",
    "type": "file",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:21.125077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-1.3-SS/7886-1.3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8263612c-c5cf-475f-878e-ca58eb83e403"
  },
  {
    "id": "c25d36e2-e7e4-4c3c-8664-5915f95363fd",
    "name": "7886-4-SS",
    "type": "folder",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:21.136077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-4-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "1049dba5-2605-4688-992e-82eb7c5dfc18",
    "name": "7886-4-SS.pdf",
    "type": "file",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:21.140077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-4-SS/7886-4-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c25d36e2-e7e4-4c3c-8664-5915f95363fd"
  },
  {
    "id": "8db949db-65cc-417f-b18c-047d86cd762c",
    "name": "7886-5-SS",
    "type": "folder",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:21.143077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-5-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7b5420f0-3cca-4dec-aef2-9ecfb747975d"
  },
  {
    "id": "e1e3d269-f7bb-4e9e-a520-bfe468fba4f6",
    "name": "7886-5-SS.pdf",
    "type": "file",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:21.147077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/SS-СС-Системы связи/7886-5-SS/7886-5-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8db949db-65cc-417f-b18c-047d86cd762c"
  },
  {
    "id": "0d874333-40c5-47ef-a0a6-e77576a7312c",
    "name": "КП на муфту",
    "type": "folder",
    "size": "19.89 KB",
    "modified": "2025-07-18T05:16:21.291080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на муфту/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "954e6766-bac9-4440-94a9-605b768e6c5c",
    "name": "Пепсико (1).xlsx",
    "type": "file",
    "size": "19.89 KB",
    "modified": "2025-07-18T05:16:21.291080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на муфту/Пепсико (1).xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0d874333-40c5-47ef-a0a6-e77576a7312c"
  },
  {
    "id": "32456bea-b5e0-4c60-9a4a-a00250b5b2d3",
    "name": "Свод от Ермека по СС",
    "type": "folder",
    "size": "123.42 KB",
    "modified": "2025-07-18T05:16:21.322080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод от Ермека по СС/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "bc413e5e-d647-4afc-9fce-914065824c54",
    "name": "Копия !1КП WV6.1.7Пепсико (9 разделов)04022025АЕ.xlsx",
    "type": "file",
    "size": "123.42 KB",
    "modified": "2025-07-18T05:16:21.323080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Свод от Ермека по СС/Копия !1КП WV6.1.7Пепсико (9 разделов)04022025АЕ.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "32456bea-b5e0-4c60-9a4a-a00250b5b2d3"
  },
  {
    "id": "d5d06ac7-02e0-47f7-a78c-772b638f93fa",
    "name": "nvent Raychem",
    "type": "folder",
    "size": "11.44 KB",
    "modified": "2025-07-18T05:16:21.244079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/nvent Raychem/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "5cf60f90-5225-48d1-93b7-41db3c5f0bfe",
    "name": "nvent Raychem_проект Пепсико.xlsx",
    "type": "file",
    "size": "11.44 KB",
    "modified": "2025-07-18T05:16:21.244079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/nvent Raychem/nvent Raychem_проект Пепсико.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d5d06ac7-02e0-47f7-a78c-772b638f93fa"
  },
  {
    "id": "9478e06a-0f22-40af-98b0-992eeb88f59c",
    "name": "for Chint",
    "type": "folder",
    "size": "48.76 MB",
    "modified": "2025-07-18T05:16:21.227078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "68110e61-5a88-41f5-a81f-bf39a4b77af8",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:21.198078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "750b5649-a165-4f77-abdb-f57c1b791733",
    "name": "РП-ЭОМ-1.1п (2025-01-28).pdf",
    "type": "file",
    "size": "12.15 MB",
    "modified": "2025-07-18T05:16:21.238079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/РП-ЭОМ-1.1п (2025-01-28).pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "ecc4d884-ce84-4ae8-bff3-3e8f4b8c9222",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:21.219078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "b280ac19-9a3f-4fe9-9671-8941ec1ea57a",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:21.224078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "210c2b27-5993-4a9e-9171-a60f671fb50e",
    "name": "Пепсико_Chint.xlsx",
    "type": "file",
    "size": "62.46 KB",
    "modified": "2025-07-18T05:16:21.226078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/Пепсико_Chint.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "95d838cc-cea8-41f3-b784-2e2a8321e54e",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:21.210078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "dbbb3de4-5083-4d86-ba8d-7ac59fabebdd",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:21.206078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "f26419c8-cc91-406c-b6b5-537922eae7c9",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:21.192078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "17813f42-8168-4be7-b22c-06ef0958b654",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:21.172077Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "cb3c7efa-8ef0-4407-81f0-99029bca69fa",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:21.214078Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/for Chint/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9478e06a-0f22-40af-98b0-992eeb88f59c"
  },
  {
    "id": "7a2a62e0-03c3-4b5c-86bd-d0001067d23b",
    "name": "КП на ДГУ",
    "type": "folder",
    "size": "506.97 KB",
    "modified": "2025-07-18T05:16:21.287080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на ДГУ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "975750b3-5033-4633-8867-f407592f3f20",
    "name": "КП_Р660 , Р780 в заводском кожухе  ТОО GQ-Contract.pdf",
    "type": "file",
    "size": "506.97 KB",
    "modified": "2025-07-18T05:16:21.287080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП на ДГУ/КП_Р660 , Р780 в заводском кожухе  ТОО GQ-Contract.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "7a2a62e0-03c3-4b5c-86bd-d0001067d23b"
  },
  {
    "id": "d41d3aef-3633-4571-ad40-090fb4096d05",
    "name": "Pepsi last revision",
    "type": "folder",
    "size": "224.58 MB",
    "modified": "2025-07-18T05:16:21.018075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "b168079d-3a35-4609-aea6-faa07d486ea9",
    "name": "OneDrive_2025-01-30.zip",
    "type": "file",
    "size": "112.29 MB",
    "modified": "2025-07-18T05:16:20.891072Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OneDrive_2025-01-30.zip",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "61b1e410-34d1-45a6-9ceb-7477ad26542b",
    "name": "OV-ОВ-Отопление и вентиляция",
    "type": "folder",
    "size": "13.25 MB",
    "modified": "2025-07-18T05:16:20.734069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "feba99f5-6b52-4568-b009-fda54a571749",
    "name": "7886-4-OV",
    "type": "folder",
    "size": "555.79 KB",
    "modified": "2025-07-18T05:16:20.722069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-4-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "bc9caf47-70aa-43c9-b50b-0bfa060fb7c3",
    "name": "7886-4-OV.pdf",
    "type": "file",
    "size": "555.79 KB",
    "modified": "2025-07-18T05:16:20.723069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-4-OV/7886-4-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "feba99f5-6b52-4568-b009-fda54a571749"
  },
  {
    "id": "bf988639-15f4-4450-8d30-56e87f718516",
    "name": "7886-1.3-OV",
    "type": "folder",
    "size": "2.12 MB",
    "modified": "2025-07-18T05:16:20.696069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-1.3-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "333413e2-4e47-4e2b-96a9-de1b480f87cf",
    "name": "7886-1.3-OV.pdf",
    "type": "file",
    "size": "2.12 MB",
    "modified": "2025-07-18T05:16:20.699069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-1.3-OV/7886-1.3-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "bf988639-15f4-4450-8d30-56e87f718516"
  },
  {
    "id": "0e91c0ed-1ad7-4b65-b30b-0f9e42f385a0",
    "name": "7886-7.1-OV",
    "type": "folder",
    "size": "235.92 KB",
    "modified": "2025-07-18T05:16:20.731069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-7.1-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "afa8c283-1e4a-4d87-81e2-d8f6eebe5cec",
    "name": "7886-7.1-OV.pdf",
    "type": "file",
    "size": "235.92 KB",
    "modified": "2025-07-18T05:16:20.732069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-7.1-OV/7886-7.1-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0e91c0ed-1ad7-4b65-b30b-0f9e42f385a0"
  },
  {
    "id": "0abfa57c-d3e0-4d81-a9de-ca7368c920b6",
    "name": "7886-5-OV",
    "type": "folder",
    "size": "379.03 KB",
    "modified": "2025-07-18T05:16:20.726069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-5-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "ac846dc7-59ad-4d76-a94b-10039ce8869c",
    "name": "7886-5-OV.pdf",
    "type": "file",
    "size": "379.03 KB",
    "modified": "2025-07-18T05:16:20.726069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-5-OV/7886-5-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0abfa57c-d3e0-4d81-a9de-ca7368c920b6"
  },
  {
    "id": "797211f7-1d58-449a-ba10-5027793c95e0",
    "name": "7886-3-OV",
    "type": "folder",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:20.714069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-3-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "0d60377c-f77d-491c-a5f2-c75a2da2b940",
    "name": "7886-3-OV.pdf",
    "type": "file",
    "size": "2.24 MB",
    "modified": "2025-07-18T05:16:20.718069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-3-OV/7886-3-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "797211f7-1d58-449a-ba10-5027793c95e0"
  },
  {
    "id": "86f9bd0f-4d85-441f-899e-fb24a226bff1",
    "name": "7886-1.2-OV",
    "type": "folder",
    "size": "7.30 MB",
    "modified": "2025-07-18T05:16:20.637068Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-1.2-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "de433854-8faa-4b0e-8387-928de1209fb3",
    "name": "7886-1.2-OV.pdf",
    "type": "file",
    "size": "7.30 MB",
    "modified": "2025-07-18T05:16:20.670068Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-1.2-OV/7886-1.2-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "86f9bd0f-4d85-441f-899e-fb24a226bff1"
  },
  {
    "id": "070000b8-1267-4dcb-a0da-3e260ccea941",
    "name": "7886-8.1-OV",
    "type": "folder",
    "size": "448.25 KB",
    "modified": "2025-07-18T05:16:20.735069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-8.1-OV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "61b1e410-34d1-45a6-9ceb-7477ad26542b"
  },
  {
    "id": "95e4d6d6-dd49-4bd8-9222-21d14e49d5fc",
    "name": "7886-8.1-OV.pdf",
    "type": "file",
    "size": "448.25 KB",
    "modified": "2025-07-18T05:16:20.736069Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/OV-ОВ-Отопление и вентиляция/7886-8.1-OV/7886-8.1-OV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "070000b8-1267-4dcb-a0da-3e260ccea941"
  },
  {
    "id": "0e9d64c1-5c90-4891-ab01-353f662634f9",
    "name": "AGPT-АГПТ-Автоматическое газовое пожаротушения",
    "type": "folder",
    "size": "3.00 MB",
    "modified": "2025-07-18T05:16:20.499065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AGPT-АГПТ-Автоматическое газовое пожаротушения/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "b0916e96-f78c-4c97-a5eb-c5060412903c",
    "name": "7886-1.3-AGPT",
    "type": "folder",
    "size": "1.13 MB",
    "modified": "2025-07-18T05:16:20.501065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.3-AGPT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0e9d64c1-5c90-4891-ab01-353f662634f9"
  },
  {
    "id": "b48604a1-3a8a-4ed3-ac4c-41e06c900f0f",
    "name": "7886-1.3-AGPT.pdf",
    "type": "file",
    "size": "1.13 MB",
    "modified": "2025-07-18T05:16:20.503065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.3-AGPT/7886-1.3-AGPT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b0916e96-f78c-4c97-a5eb-c5060412903c"
  },
  {
    "id": "1e645c56-6a2d-4f2e-89e0-f37394656aee",
    "name": "7886-1.2-AGPT",
    "type": "folder",
    "size": "1.87 MB",
    "modified": "2025-07-18T05:16:20.493065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.2-AGPT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0e9d64c1-5c90-4891-ab01-353f662634f9"
  },
  {
    "id": "c88886ef-3a7e-4bc4-b450-2bba0ebf6241",
    "name": "7886-1.2-AGPT.pdf",
    "type": "file",
    "size": "1.87 MB",
    "modified": "2025-07-18T05:16:20.496065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AGPT-АГПТ-Автоматическое газовое пожаротушения/7886-1.2-AGPT/7886-1.2-AGPT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1e645c56-6a2d-4f2e-89e0-f37394656aee"
  },
  {
    "id": "e7666821-7042-4a26-bf39-0fbd40210c57",
    "name": "SS-СС-Системы связи",
    "type": "folder",
    "size": "27.08 MB",
    "modified": "2025-07-18T05:16:21.009074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "9c2701af-ec13-4e6a-8628-968089b293ea",
    "name": "7886-1.2-SS",
    "type": "folder",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:20.951073Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-1.2-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "95e79f4a-cfdc-46e1-924b-57e9a9498e29",
    "name": "7886-1.2-SS_RevAN.pdf",
    "type": "file",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:20.967074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-1.2-SS/7886-1.2-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9c2701af-ec13-4e6a-8628-968089b293ea"
  },
  {
    "id": "a6ed7945-4720-4da5-8f46-8d2d5ac0267a",
    "name": "7886-7-SS",
    "type": "folder",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:21.010074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-7-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "3d5d6528-d182-4261-a346-63c77409ffd6",
    "name": "7886-7-SS_RevAN.pdf",
    "type": "file",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:21.013074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-7-SS/7886-7-SS_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "a6ed7945-4720-4da5-8f46-8d2d5ac0267a"
  },
  {
    "id": "96c381b9-3924-41a4-9dbf-ecdd1c224178",
    "name": "7886-3-SS",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:20.989074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "1cba54e2-9690-4c8b-baf0-4a953ab31b5c",
    "name": "7886-3-SS.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:20.992074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-3-SS/7886-3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "96c381b9-3924-41a4-9dbf-ecdd1c224178"
  },
  {
    "id": "124994cd-19e3-4b95-9b15-979738ed8c56",
    "name": "7886-1.3-SS",
    "type": "folder",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:20.974074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-1.3-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "09daa718-b525-4186-a701-9688b957d202",
    "name": "7886-1.3-SS.pdf",
    "type": "file",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:20.985074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-1.3-SS/7886-1.3-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "124994cd-19e3-4b95-9b15-979738ed8c56"
  },
  {
    "id": "3563f518-44e7-4405-b258-d325f414e6c1",
    "name": "7886-4-SS",
    "type": "folder",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:20.995074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-4-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "a4c17eef-b0c1-479b-b431-e657284503fb",
    "name": "7886-4-SS.pdf",
    "type": "file",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:21.000074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-4-SS/7886-4-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3563f518-44e7-4405-b258-d325f414e6c1"
  },
  {
    "id": "1e446d00-48d1-42c3-8c90-26142e3041d9",
    "name": "7886-5-SS",
    "type": "folder",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:21.004074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-5-SS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e7666821-7042-4a26-bf39-0fbd40210c57"
  },
  {
    "id": "952c0a0d-028e-4a7b-9d91-afb6e086736a",
    "name": "7886-5-SS.pdf",
    "type": "file",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:21.007074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/SS-СС-Системы связи/7886-5-SS/7886-5-SS.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1e446d00-48d1-42c3-8c90-26142e3041d9"
  },
  {
    "id": "4573ed6e-5896-4c4c-876e-ad6d96fa84c8",
    "name": "AS-AC-Архитектурно строительные решения (Ограждение)",
    "type": "folder",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:20.524065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AS-AC-Архитектурно строительные решения (Ограждение)/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "0451d24a-e392-4e21-a316-4b4a74857c99",
    "name": "7886-18-AS",
    "type": "folder",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:20.525065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AS-AC-Архитектурно строительные решения (Ограждение)/7886-18-AS/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4573ed6e-5896-4c4c-876e-ad6d96fa84c8"
  },
  {
    "id": "494bf7e6-71a9-440a-acdb-6fdfd67ef5ff",
    "name": "7886-18-AS_Ograzhdenie_RevAN2.pdf",
    "type": "file",
    "size": "1.94 MB",
    "modified": "2025-07-18T05:16:20.527066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AS-AC-Архитектурно строительные решения (Ограждение)/7886-18-AS/7886-18-AS_Ograzhdenie_RevAN2.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0451d24a-e392-4e21-a316-4b4a74857c99"
  },
  {
    "id": "dabc5629-38e6-4d5a-ba09-161c7aa7be90",
    "name": "ADU-АДУ-Автоматическое дымоудаление",
    "type": "folder",
    "size": "3.34 MB",
    "modified": "2025-07-18T05:16:20.489065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/ADU-АДУ-Автоматическое дымоудаление/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "c78171e1-ec3f-4199-8cd9-7e8d626f90bb",
    "name": "7886-1.3-ADU",
    "type": "folder",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:20.490065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/ADU-АДУ-Автоматическое дымоудаление/7886-1.3-ADU/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dabc5629-38e6-4d5a-ba09-161c7aa7be90"
  },
  {
    "id": "a8c43b4b-f313-4338-84dd-5e056252109a",
    "name": "7886-1.3-ADU.pdf",
    "type": "file",
    "size": "1.20 MB",
    "modified": "2025-07-18T05:16:20.491065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/ADU-АДУ-Автоматическое дымоудаление/7886-1.3-ADU/7886-1.3-ADU.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c78171e1-ec3f-4199-8cd9-7e8d626f90bb"
  },
  {
    "id": "f31c8995-f44c-4db8-9b99-96ec2e281209",
    "name": "7886-1.2-ADU",
    "type": "folder",
    "size": "2.14 MB",
    "modified": "2025-07-18T05:16:20.481065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/ADU-АДУ-Автоматическое дымоудаление/7886-1.2-ADU/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dabc5629-38e6-4d5a-ba09-161c7aa7be90"
  },
  {
    "id": "263aeb0e-c50a-4e8c-8f18-6606abf2183a",
    "name": "7886-1.2-ADU.pdf",
    "type": "file",
    "size": "2.14 MB",
    "modified": "2025-07-18T05:16:20.483065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/ADU-АДУ-Автоматическое дымоудаление/7886-1.2-ADU/7886-1.2-ADU.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f31c8995-f44c-4db8-9b99-96ec2e281209"
  },
  {
    "id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b",
    "name": "VK-ВК-Водоснабжение и канализация",
    "type": "folder",
    "size": "19.62 MB",
    "modified": "2025-07-18T05:16:21.088076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "dde6e4b7-a366-4d26-a417-3d226e7396b4",
    "name": "7886-3-VK",
    "type": "folder",
    "size": "772.30 KB",
    "modified": "2025-07-18T05:16:21.071075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-3-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "b0af52aa-ac46-45e2-9f3e-87686bde1850",
    "name": "7886-3-VK.pdf",
    "type": "file",
    "size": "772.30 KB",
    "modified": "2025-07-18T05:16:21.073076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-3-VK/7886-3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "dde6e4b7-a366-4d26-a417-3d226e7396b4"
  },
  {
    "id": "f8fbd2af-f8df-455c-9dff-f1edf8b03b7a",
    "name": "7886-7-VK",
    "type": "folder",
    "size": "2.98 MB",
    "modified": "2025-07-18T05:16:21.082076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-7-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "7f796e45-5ca7-4ff2-b481-d1982a4b7eea",
    "name": "7886-7-VK_RevAN.pdf",
    "type": "file",
    "size": "2.98 MB",
    "modified": "2025-07-18T05:16:21.086076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-7-VK/7886-7-VK_RevAN.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f8fbd2af-f8df-455c-9dff-f1edf8b03b7a"
  },
  {
    "id": "f41d8a08-e963-4814-9e10-017c9fbaa50f",
    "name": "7886-1.2-VK",
    "type": "folder",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:21.020075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.2-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "6600b26a-04c3-4bc4-8c04-98df348d426c",
    "name": "7886-1.2-VK.pdf",
    "type": "file",
    "size": "5.30 MB",
    "modified": "2025-07-18T05:16:21.026075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.2-VK/7886-1.2-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f41d8a08-e963-4814-9e10-017c9fbaa50f"
  },
  {
    "id": "585f4c60-37bc-4bcf-a83d-c7eb799cb5be",
    "name": "7886-4-VK",
    "type": "folder",
    "size": "546.88 KB",
    "modified": "2025-07-18T05:16:21.076076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-4-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "22f4c7da-b150-4403-936c-24caf29f529d",
    "name": "7886-4-VK.pdf",
    "type": "file",
    "size": "546.88 KB",
    "modified": "2025-07-18T05:16:21.076076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-4-VK/7886-4-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "585f4c60-37bc-4bcf-a83d-c7eb799cb5be"
  },
  {
    "id": "366d02dd-b599-4624-9b56-b205abd83c7d",
    "name": "7886-5-VK",
    "type": "folder",
    "size": "488.90 KB",
    "modified": "2025-07-18T05:16:21.079076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-5-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "d7080134-0c21-446b-bd65-c289665aa6ad",
    "name": "7886-5-VK.pdf",
    "type": "file",
    "size": "488.90 KB",
    "modified": "2025-07-18T05:16:21.080076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-5-VK/7886-5-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "366d02dd-b599-4624-9b56-b205abd83c7d"
  },
  {
    "id": "9d3deb96-d868-448e-9824-e7ce346c8cb9",
    "name": "7886-1.3-VK",
    "type": "folder",
    "size": "5.17 MB",
    "modified": "2025-07-18T05:16:21.051075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.3-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "e2945de2-05c0-4f49-a1fd-26573f729cac",
    "name": "7886-1.3-VK.pdf",
    "type": "file",
    "size": "5.17 MB",
    "modified": "2025-07-18T05:16:21.067075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.3-VK/7886-1.3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "9d3deb96-d868-448e-9824-e7ce346c8cb9"
  },
  {
    "id": "f12bab80-1db5-427b-82cf-47b65558f0f9",
    "name": "7886-8-VK",
    "type": "folder",
    "size": "2.85 MB",
    "modified": "2025-07-18T05:16:21.089076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-8-VK/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "edbb5da5-740b-4140-9de5-39a01e776bb6",
    "name": "7886-8.1-8.2-8.3-VK.pdf",
    "type": "file",
    "size": "2.85 MB",
    "modified": "2025-07-18T05:16:21.093076Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-8-VK/7886-8.1-8.2-8.3-VK.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f12bab80-1db5-427b-82cf-47b65558f0f9"
  },
  {
    "id": "12e0d695-095c-4004-bbd2-feb61a6fbcbd",
    "name": "7886-1.2-VK.PT",
    "type": "folder",
    "size": "1.55 MB",
    "modified": "2025-07-18T05:16:21.037075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.2-VK.PT/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "15ae2924-3f5a-49ef-a9ff-0a18bcace39b"
  },
  {
    "id": "2e9cfc85-4dfb-4b38-8237-98b1d305e40d",
    "name": "7886-1.2-VK.PT.pdf",
    "type": "file",
    "size": "1.55 MB",
    "modified": "2025-07-18T05:16:21.039075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/VK-ВК-Водоснабжение и канализация/7886-1.2-VK.PT/7886-1.2-VK.PT.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "12e0d695-095c-4004-bbd2-feb61a6fbcbd"
  },
  {
    "id": "6000bdb0-9dc5-43df-b107-f9a45f0145cb",
    "name": "TM-ТМ-Тепломеханические решения",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:21.015074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/TM-ТМ-Тепломеханические решения/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "03abb775-ee27-49f6-a74e-ae1628f94699",
    "name": "7886-3-TM",
    "type": "folder",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:21.015074Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/TM-ТМ-Тепломеханические решения/7886-3-TM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "6000bdb0-9dc5-43df-b107-f9a45f0145cb"
  },
  {
    "id": "fa7319a7-9ba1-493b-9e6e-9ca4e9433082",
    "name": "7886-3-TM.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:21.017075Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/TM-ТМ-Тепломеханические решения/7886-3-TM/7886-3-TM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "03abb775-ee27-49f6-a74e-ae1628f94699"
  },
  {
    "id": "538434f1-4212-4cda-863b-529a26fe8a48",
    "name": "AOV-АОВ-Автоматическое газообноружение",
    "type": "folder",
    "size": "5.44 MB",
    "modified": "2025-07-18T05:16:20.509065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AOV-АОВ-Автоматическое газообноружение/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "418bd21d-f2b8-4ad4-8517-300a3749e017",
    "name": "7886-3-AOV",
    "type": "folder",
    "size": "5.44 MB",
    "modified": "2025-07-18T05:16:20.510065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AOV-АОВ-Автоматическое газообноружение/7886-3-AOV/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "538434f1-4212-4cda-863b-529a26fe8a48"
  },
  {
    "id": "baa03eb0-e217-4145-ad67-33f7cafff66f",
    "name": "7886-3-AOV.pdf",
    "type": "file",
    "size": "5.44 MB",
    "modified": "2025-07-18T05:16:20.520065Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/AOV-АОВ-Автоматическое газообноружение/7886-3-AOV/7886-3-AOV.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "418bd21d-f2b8-4ad4-8517-300a3749e017"
  },
  {
    "id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8",
    "name": "EOM-ЭОМ-Электрооборудование",
    "type": "folder",
    "size": "36.55 MB",
    "modified": "2025-07-18T05:16:20.608067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "d41d3aef-3633-4571-ad40-090fb4096d05"
  },
  {
    "id": "8b1ee470-1250-4bd1-baf3-0dbc56e4573a",
    "name": "7886-8.1-EOM",
    "type": "folder",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:20.609067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-8.1-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "7d8fb479-6991-4a9b-a317-fa930be3c794",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:20.612067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-8.1-EOM/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "8b1ee470-1250-4bd1-baf3-0dbc56e4573a"
  },
  {
    "id": "1e23afdd-9534-457e-97b3-571b5ec23dc3",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:20.573066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "8cd96e9d-45ed-4627-91f9-94c48841f1e8",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:20.579067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-3-EOM/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1e23afdd-9534-457e-97b3-571b5ec23dc3"
  },
  {
    "id": "99b4fd34-4400-41e6-88ef-db9c807de373",
    "name": "7886-4-EOM",
    "type": "folder",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:20.583066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-4-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "942ce52f-4911-4c71-acf8-4bd4236ce55e",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:20.585067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-4-EOM/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "99b4fd34-4400-41e6-88ef-db9c807de373"
  },
  {
    "id": "c79b93ba-eb8a-4bb8-b4d9-eff69c14b780",
    "name": "7886-5-EOM",
    "type": "folder",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:20.587067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-5-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "4dd10a05-6c3a-4456-9814-4d2fa0074208",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:20.589067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-5-EOM/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "c79b93ba-eb8a-4bb8-b4d9-eff69c14b780"
  },
  {
    "id": "1fb6a89f-ad1b-4c29-aacf-08ceffb5f8d6",
    "name": "7886-2-EOM",
    "type": "folder",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:20.570066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-2-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "f2005630-72c7-47aa-8b46-0e0683a82b19",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:20.571066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-2-EOM/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1fb6a89f-ad1b-4c29-aacf-08ceffb5f8d6"
  },
  {
    "id": "42ec4d4d-415c-4191-b890-f9a6f6de2d4a",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:20.531066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "c60053fd-8664-4b0e-b6e1-6114e6adbc1b",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:20.540066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-1.2-EOM1/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "42ec4d4d-415c-4191-b890-f9a6f6de2d4a"
  },
  {
    "id": "b5862f73-2405-453d-8d71-3b7e8ed1f14a",
    "name": "7886-7-EOM",
    "type": "folder",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.603067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-7-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "835db50a-8099-4eda-9531-85f417770779",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.606067Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-7-EOM/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "b5862f73-2405-453d-8d71-3b7e8ed1f14a"
  },
  {
    "id": "4e1060df-77dd-42bb-a6fd-ce4000b1c521",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:20.546066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "f6f01ef5-7b3c-4774-a462-4a7b3cbafec8"
  },
  {
    "id": "a9809e91-f1ea-4820-8184-14f5f2a73bdf",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:20.564066Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/Pepsi last revision/EOM-ЭОМ-Электрооборудование/7886-1.3-EOM/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "4e1060df-77dd-42bb-a6fd-ce4000b1c521"
  },
  {
    "id": "88e36010-cc4c-41a0-bf5f-9c1b902b1ca9",
    "name": "КП ДКС, ХИЛТИ",
    "type": "folder",
    "size": "273.59 KB",
    "modified": "2025-07-18T05:16:21.280079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ДКС, ХИЛТИ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "c7fbdc7f-0dc1-49f2-b570-cc196a423907",
    "name": "КП Hilti.pdf",
    "type": "file",
    "size": "110.97 KB",
    "modified": "2025-07-18T05:16:21.276079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ДКС, ХИЛТИ/КП Hilti.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "88e36010-cc4c-41a0-bf5f-9c1b902b1ca9"
  },
  {
    "id": "7eeda6b6-95af-4b3c-9cca-5ef41d3d34c9",
    "name": "КП №845_DKC_ от 30.01.2025 ПепсиКо СС.xlsx",
    "type": "file",
    "size": "43.51 KB",
    "modified": "2025-07-18T05:16:21.277079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ДКС, ХИЛТИ/КП №845_DKC_ от 30.01.2025 ПепсиКо СС.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "88e36010-cc4c-41a0-bf5f-9c1b902b1ca9"
  },
  {
    "id": "32b8a0f5-e24c-43ab-b535-80233bfc5903",
    "name": "КП №846_DKC_от 30.01.2025 ПепсиКо ЭОМ.xlsx",
    "type": "file",
    "size": "94.27 KB",
    "modified": "2025-07-18T05:16:21.278079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ДКС, ХИЛТИ/КП №846_DKC_от 30.01.2025 ПепсиКо ЭОМ.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "88e36010-cc4c-41a0-bf5f-9c1b902b1ca9"
  },
  {
    "id": "84d36c9b-2dba-42de-8038-d11bf4c8fe62",
    "name": "КП №868_ от 07.02.2025 ПепсиКо ЭОМ 1,1.xlsx",
    "type": "file",
    "size": "24.84 KB",
    "modified": "2025-07-18T05:16:21.280079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ДКС, ХИЛТИ/КП №868_ от 07.02.2025 ПепсиКо ЭОМ 1,1.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "88e36010-cc4c-41a0-bf5f-9c1b902b1ca9"
  },
  {
    "id": "722f64a8-174d-4b3e-9fe0-34109955ef13",
    "name": "КП ГП ЭОМ",
    "type": "folder",
    "size": "8.36 MB",
    "modified": "2025-07-18T05:16:21.260079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "6ebc3679-bc44-4a04-8f6e-84bf4f312f59",
    "name": "КП ГП Энергоблок.pdf",
    "type": "file",
    "size": "458.96 KB",
    "modified": "2025-07-18T05:16:21.259079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Энергоблок.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "b7f3e784-0e90-407c-9958-a07f75d9ffd5",
    "name": "КП ГП КПП1.pdf",
    "type": "file",
    "size": "377.31 KB",
    "modified": "2025-07-18T05:16:21.252079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП КПП1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "1e7ded46-a391-4767-a4ae-8a6fc536dc47",
    "name": "КП ГП Производственный блок.pdf",
    "type": "file",
    "size": "631.61 KB",
    "modified": "2025-07-18T05:16:21.255079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Производственный блок.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "1cbb09a6-3ae9-4449-9bac-719d1e623c1e",
    "name": "КП ГП КПП2.pdf",
    "type": "file",
    "size": "370.24 KB",
    "modified": "2025-07-18T05:16:21.253079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП КПП2.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "800247bb-79e8-4aeb-ab19-04a316003f43",
    "name": "КП ГП Сооружения водоподготовки.pdf",
    "type": "file",
    "size": "389.22 KB",
    "modified": "2025-07-18T05:16:21.259079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Сооружения водоподготовки.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "d4cdeec0-bb9a-4d29-865b-41798674f197",
    "name": "КП ГП Склад готовой продукции.pdf",
    "type": "file",
    "size": "459.27 KB",
    "modified": "2025-07-18T05:16:21.258079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Склад готовой продукции.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "c6d87db6-7d67-4516-8c94-4e448d9f0075",
    "name": "КП ГП Весовая.pdf",
    "type": "file",
    "size": "285.10 KB",
    "modified": "2025-07-18T05:16:21.247079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Весовая.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "c900839d-b265-42be-b8bc-3b4d442239ef",
    "name": "КП ГП Главный Корпус АБК.pdf",
    "type": "file",
    "size": "491.38 KB",
    "modified": "2025-07-18T05:16:21.250079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Главный Корпус АБК.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "5994659a-f49d-407f-b77a-ac886186ceb8",
    "name": "КП ГП Противопожарная насосная.pdf",
    "type": "file",
    "size": "409.75 KB",
    "modified": "2025-07-18T05:16:21.257079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП ГП Противопожарная насосная.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05",
    "name": "КП на СМР",
    "type": "folder",
    "size": "4.57 MB",
    "modified": "2025-07-18T05:16:21.272079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "722f64a8-174d-4b3e-9fe0-34109955ef13"
  },
  {
    "id": "e70f869e-aa37-4a5b-a614-725f8ca6bd8c",
    "name": "КП СМР Производственный блок .pdf",
    "type": "file",
    "size": "343.54 KB",
    "modified": "2025-07-18T05:16:21.268079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Производственный блок .pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "bc8517ac-85e4-4c27-ad7d-077a11f8a0b9",
    "name": "КП СМР Противопожарная насосная станция.pdf",
    "type": "file",
    "size": "259.57 KB",
    "modified": "2025-07-18T05:16:21.269079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Противопожарная насосная станция.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "8408888d-d7be-4678-af28-4da62322a0f1",
    "name": "КП СМР Энергоблок .pdf",
    "type": "file",
    "size": "299.75 KB",
    "modified": "2025-07-18T05:16:21.271079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Энергоблок .pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "1c12f0bd-3100-446c-a7e5-adb30f78c70e",
    "name": "КП СМР КПП2.pdf",
    "type": "file",
    "size": "266.63 KB",
    "modified": "2025-07-18T05:16:21.267079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР КПП2.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "d31db0fa-c4b7-433b-abe4-06caf4e2dea1",
    "name": "КП СМР.zip",
    "type": "file",
    "size": "2.06 MB",
    "modified": "2025-07-18T05:16:21.274079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР.zip",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "bba946a7-2b5a-4589-ae65-540f42b3967a",
    "name": "КП СМР Сооружения подоподготовки.pdf",
    "type": "file",
    "size": "259.41 KB",
    "modified": "2025-07-18T05:16:21.270079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Сооружения подоподготовки.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "d4d4ffa4-90bc-41b4-85bc-1fe0c692b2bb",
    "name": "КП СМР Весовая.pdf",
    "type": "file",
    "size": "186.34 KB",
    "modified": "2025-07-18T05:16:21.264079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Весовая.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "637fb77b-a8d5-406c-a788-a0cb3f62d85c",
    "name": "КП СМР КПП 1.pdf",
    "type": "file",
    "size": "271.62 KB",
    "modified": "2025-07-18T05:16:21.266079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР КПП 1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "c3c14f77-447c-4796-be42-63812e1e3423",
    "name": "КП СМР Админ блок .pdf",
    "type": "file",
    "size": "358.60 KB",
    "modified": "2025-07-18T05:16:21.262079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР Админ блок .pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "a204ef6c-e5e3-45be-a4c1-c42b7eef84d2",
    "name": "КП СМР склад готовой продукции.pdf",
    "type": "file",
    "size": "329.85 KB",
    "modified": "2025-07-18T05:16:21.272079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП ГП ЭОМ/КП на СМР/КП СМР склад готовой продукции.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "ea87404e-34ff-48d6-9a2e-0bdbbb8aaa05"
  },
  {
    "id": "18e451af-78c3-407f-a9c9-15b25868c04f",
    "name": "КП от Еркин GQ",
    "type": "folder",
    "size": "24.25 KB",
    "modified": "2025-07-18T05:16:21.307080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от Еркин GQ/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "a37ca073-da07-41a4-9cf7-16732deb7cd8",
    "name": "Pepsiko_p — копия.xlsx",
    "type": "file",
    "size": "24.25 KB",
    "modified": "2025-07-18T05:16:21.307080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от Еркин GQ/Pepsiko_p — копия.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "18e451af-78c3-407f-a9c9-15b25868c04f"
  },
  {
    "id": "fcf0b579-8451-4fe2-a5b9-5a623edccb7d",
    "name": "КП от Construction на кабели",
    "type": "folder",
    "size": "1.03 MB",
    "modified": "2025-07-18T05:16:21.297080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от Construction на кабели/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "f7500103-bfa3-43a0-af20-360977044235",
    "name": "КП ТМЦ construction.xlsx",
    "type": "file",
    "size": "728.79 KB",
    "modified": "2025-07-18T05:16:21.298080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от Construction на кабели/КП ТМЦ construction.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fcf0b579-8451-4fe2-a5b9-5a623edccb7d"
  },
  {
    "id": "2828f495-92b2-47a5-8f12-f516a16544c8",
    "name": "КП СМР завод .xlsx",
    "type": "file",
    "size": "328.37 KB",
    "modified": "2025-07-18T05:16:21.296080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от Construction на кабели/КП СМР завод .xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "fcf0b579-8451-4fe2-a5b9-5a623edccb7d"
  },
  {
    "id": "3825920a-c862-4a6f-a6e8-6812e8a8bbcf",
    "name": "КП инделект",
    "type": "folder",
    "size": "1.64 MB",
    "modified": "2025-07-18T05:16:21.285079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП инделект/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "661f01bb-9f5d-4541-b9cb-11311261c2e4",
    "name": "s60 for GQ.pdf",
    "type": "file",
    "size": "831.39 KB",
    "modified": "2025-07-18T05:16:21.282079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП инделект/s60 for GQ.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3825920a-c862-4a6f-a6e8-6812e8a8bbcf"
  },
  {
    "id": "b94f43e3-8ee9-432d-ae2d-352dd408cc26",
    "name": "спека.xlsx",
    "type": "file",
    "size": "21.88 KB",
    "modified": "2025-07-18T05:16:21.286079Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП инделект/спека.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3825920a-c862-4a6f-a6e8-6812e8a8bbcf"
  },
  {
    "id": "060b2b26-274e-43a4-b803-8d085a5b2d06",
    "name": "кп инделек.pdf",
    "type": "file",
    "size": "829.38 KB",
    "modified": "2025-07-18T05:16:21.284080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП инделект/кп инделек.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3825920a-c862-4a6f-a6e8-6812e8a8bbcf"
  },
  {
    "id": "2c9bf312-f7e8-4994-ade6-d90a51137923",
    "name": "КП от HPE",
    "type": "folder",
    "size": "1019.34 KB",
    "modified": "2025-07-18T05:16:21.305080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от HPE/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "307b188a-8222-485e-ba8c-24eec2484a9f",
    "name": "КП pepsico-gq 140225.xlsx",
    "type": "file",
    "size": "140.53 KB",
    "modified": "2025-07-18T05:16:21.306080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от HPE/КП pepsico-gq 140225.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2c9bf312-f7e8-4994-ade6-d90a51137923"
  },
  {
    "id": "83770ca9-80b1-4971-ad49-5f4b3598b3d7",
    "name": "RG pepsico-gq 270225 КП обновленное 27.02.25.xlsx",
    "type": "file",
    "size": "156.82 KB",
    "modified": "2025-07-18T05:16:21.305080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от HPE/RG pepsico-gq 270225 КП обновленное 27.02.25.xlsx",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2c9bf312-f7e8-4994-ade6-d90a51137923"
  },
  {
    "id": "f2b5b1ea-4dbe-4ccd-a2a2-9c92b3eac0ca",
    "name": "RE_ SS-СС-Системы связи_rar объект_ _Строительство завода Пепсико__lastupdated.msg",
    "type": "file",
    "size": "459.50 KB",
    "modified": "2025-07-18T05:16:21.303080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от HPE/RE_ SS-СС-Системы связи_rar объект_ _Строительство завода Пепсико__lastupdated.msg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2c9bf312-f7e8-4994-ade6-d90a51137923"
  },
  {
    "id": "0e44c121-e4bd-493f-adb8-190dd18b9052",
    "name": "RE_ SS-СС-Системы связи_rar объект_ _Строительство завода Пепсико__...msg",
    "type": "file",
    "size": "262.50 KB",
    "modified": "2025-07-18T05:16:21.301080Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/КП от HPE/RE_ SS-СС-Системы связи_rar объект_ _Строительство завода Пепсико__...msg",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2c9bf312-f7e8-4994-ade6-d90a51137923"
  },
  {
    "id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c",
    "name": "EOM-ЭОМ-Электрооборудование",
    "type": "folder",
    "size": "78.69 MB",
    "modified": "2025-07-18T05:16:20.461064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "33dd3e83-fcff-44c2-b7c0-cbeb895c018b"
  },
  {
    "id": "d1fba808-0ae1-464e-9106-9fa8699d1a09",
    "name": "РП-СС-5п-ККП-2.pdf",
    "type": "file",
    "size": "2.37 MB",
    "modified": "2025-07-18T05:16:20.430064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-5п-ККП-2.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "92e55b7d-41d8-4bf0-a71d-f24a63663a07",
    "name": "РП-ЭОМ-1.1п (2025-01-28).pdf",
    "type": "file",
    "size": "12.15 MB",
    "modified": "2025-07-18T05:16:20.454064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-ЭОМ-1.1п (2025-01-28).pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "a5e743e1-42f4-4062-93c6-0ce4251eb24b",
    "name": "РП-СС-1.2п-АдминБытБлок.pdf",
    "type": "file",
    "size": "12.25 MB",
    "modified": "2025-07-18T05:16:20.398063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-1.2п-АдминБытБлок.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "a21491f3-97e8-48a8-8454-8f023bc80ccb",
    "name": "РП-СС-1.3п-СкладБлок.pdf",
    "type": "file",
    "size": "6.23 MB",
    "modified": "2025-07-18T05:16:20.412063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-1.3п-СкладБлок.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "8cca2aac-8f3a-4e3d-a95c-057daa4f8ae0",
    "name": "РП-СС-3п-ЭнергоБлок.pdf",
    "type": "file",
    "size": "2.08 MB",
    "modified": "2025-07-18T05:16:20.419064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-3п-ЭнергоБлок.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "dc610e58-d2be-4ec0-96f9-074ea5332060",
    "name": "РП-СС-7п-НасосСтанцВоды.pdf",
    "type": "file",
    "size": "1.57 MB",
    "modified": "2025-07-18T05:16:20.434064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-7п-НасосСтанцВоды.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "3bfcb9fb-d6c9-4e79-9135-25b316807eb4",
    "name": "РП-ЭОМ-1.1п (2025-01-28)-52-58.pdf",
    "type": "file",
    "size": "242.94 KB",
    "modified": "2025-07-18T05:16:20.436064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-ЭОМ-1.1п (2025-01-28)-52-58.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "6f19550e-9c6a-4d13-ac81-1eae95726e92",
    "name": "РП-ЭОМ-7п.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.464064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-ЭОМ-7п.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "05312805-45f9-4df9-aaa5-733ab980c3ff",
    "name": "РП-СС-4п-КПП-1.pdf",
    "type": "file",
    "size": "2.58 MB",
    "modified": "2025-07-18T05:16:20.425064Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/РП-СС-4п-КПП-1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "3a4b087a-dc77-4f54-8fe7-7d60f808cb18",
    "name": "7886-8.1-EOM",
    "type": "folder",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:20.379063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-8.1-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "51414e4b-0142-4ac4-981d-eced2b9a4369",
    "name": "7886-8.1-EOM.pdf",
    "type": "file",
    "size": "2.27 MB",
    "modified": "2025-07-18T05:16:20.383063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-8.1-EOM/7886-8.1-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "3a4b087a-dc77-4f54-8fe7-7d60f808cb18"
  },
  {
    "id": "0555b0ef-67d9-46da-aa0b-93608fd634a0",
    "name": "7886-3-EOM",
    "type": "folder",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:20.356062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "a7c2c54b-0743-451b-8b3a-d4fb9a03f88a",
    "name": "7886-3-EOM.pdf",
    "type": "file",
    "size": "6.18 MB",
    "modified": "2025-07-18T05:16:20.361063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-3-EOM/7886-3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "0555b0ef-67d9-46da-aa0b-93608fd634a0"
  },
  {
    "id": "2d07f5ee-3c90-4c77-9a23-ceaca9b09150",
    "name": "7886-4-EOM",
    "type": "folder",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:20.366063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-4-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "79632926-17ca-41c1-9dbe-b5c344975d6a",
    "name": "7886-4-EOM.pdf",
    "type": "file",
    "size": "1.91 MB",
    "modified": "2025-07-18T05:16:20.368063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-4-EOM/7886-4-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "2d07f5ee-3c90-4c77-9a23-ceaca9b09150"
  },
  {
    "id": "1f003d0c-cd0c-483c-9b7d-eee9c50e5984",
    "name": "7886-5-EOM",
    "type": "folder",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:20.369063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-5-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "76df0839-02f3-47cc-9af1-5981f3fc75a2",
    "name": "7886-5-EOM.pdf",
    "type": "file",
    "size": "1.90 MB",
    "modified": "2025-07-18T05:16:20.371063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-5-EOM/7886-5-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "1f003d0c-cd0c-483c-9b7d-eee9c50e5984"
  },
  {
    "id": "accf0461-7d57-4e9e-afa0-69ece04d16b8",
    "name": "7886-2-EOM",
    "type": "folder",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:20.353062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-2-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "9fe3c2fc-170d-4742-ab49-8f6d28f9e1ff",
    "name": "7886-2-EOM.pdf",
    "type": "file",
    "size": "904.09 KB",
    "modified": "2025-07-18T05:16:20.354062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-2-EOM/7886-2-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "accf0461-7d57-4e9e-afa0-69ece04d16b8"
  },
  {
    "id": "e1ccf938-be2d-4c13-9b82-326ac51b7703",
    "name": "7886-1.2-EOM1",
    "type": "folder",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:20.323062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-1.2-EOM1/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "f4c4ece4-dd93-49a3-b811-15758efffedb",
    "name": "7886-1.2-EOM1.pdf",
    "type": "file",
    "size": "9.33 MB",
    "modified": "2025-07-18T05:16:20.334062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-1.2-EOM1/7886-1.2-EOM1.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e1ccf938-be2d-4c13-9b82-326ac51b7703"
  },
  {
    "id": "e80af995-390a-43ac-94f0-bd96dcc3fe58",
    "name": "7886-7-EOM",
    "type": "folder",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.374063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-7-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "54d5f8bd-49ee-4a57-9979-da4dbba5871b",
    "name": "7886-7-EOM.pdf",
    "type": "file",
    "size": "2.68 MB",
    "modified": "2025-07-18T05:16:20.376063Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-7-EOM/7886-7-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "e80af995-390a-43ac-94f0-bd96dcc3fe58"
  },
  {
    "id": "630aab01-5278-48a5-9079-e2423c1a3d7d",
    "name": "7886-1.3-EOM",
    "type": "folder",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:20.338062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-1.3-EOM/",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "137ad5d8-4e4c-449c-b8d4-cc5a704ec39c"
  },
  {
    "id": "28a3f2e4-dae9-4bf4-b2b3-5c84087ab9a3",
    "name": "7886-1.3-EOM.pdf",
    "type": "file",
    "size": "11.41 MB",
    "modified": "2025-07-18T05:16:20.348062Z",
    "owner": "MADIYAR SADU",
    "category": "general",
    "path": "4. Procurement/ПепсиКо Центральная Азия/EOM-ЭОМ-Электрооборудование/7886-1.3-EOM/7886-1.3-EOM.pdf",
    "tags": [],
    "archived": false,
    "starred": false,
    "parent_id": "630aab01-5278-48a5-9079-e2423c1a3d7d"
  }
]


const Index = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [category, setCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const treeData: TreeNode[] = React.useMemo(() => buildTree(documents), [documents]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [folderId, setFolderId] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  const token = localStorage.getItem('authToken')

 

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/v2/metadata?limit=50&offset=0", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      const docsKey = Object.keys(data).find(key => Array.isArray(data[key]));

      if (docsKey && Array.isArray(data[docsKey])) {
        const transformedDocuments: Document[] = data[docsKey].map((doc: BackendDocument) => ({
          id: doc.id,
          name: doc.name ? decodeURIComponent(doc.name) : 'Unnamed Document',
          type: doc.file_type ? (
            doc.file_type.includes('pdf') ? 'pdf' :
          doc.file_type.includes('doc') ? 'doc' :
          doc.file_type.includes('xls') ? 'xlsx' :
          doc.file_type.includes('ppt') ? 'ppt' :
          doc.file_type.includes('pptx') ? 'pptx' :
          doc.file_type.includes('png') ? 'png' :
          doc.file_type.includes('image') ? 'image' : 'file'
          ) : 'file',
          size: doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
          modified: doc.created_at,
          owner: doc.owner_id,
          category: doc.categories?.[0] || 'uncategorized',
          path: doc.file_path,
          tags: doc.tags || [],
          parent_id: doc.parent_id ?? null,
          archived: doc.status === 'archived',
          starred: false,
        }));
     const combined = [...transformedDocuments, ...mockDocuments];
     setDocuments(combined);      
} else {
        console.log('No real documents found');
        setDocuments(mockDocuments);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.log('Using due to API error');
      setDocuments(mockDocuments);
      toast({
        title: "Info",
        description: "Files loaded from DB",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const { createShareLink, shareWithUsers, loading: shareLoading, error: shareError } = useShare();

  // Handler that you’ll pass down to your grid/item “Share” button:
  const openShare = (doc: Document) => {
    setShareDoc(doc);
    setIsShareOpen(true);
   };

  const closeShareModal = () => {
    setShareDoc(null);
    setIsShareOpen(false);
  };


  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Preview document

  const handleFileUpload = async (files: File[], folderId?: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    try {
      const response = await axios.post("http://localhost:8000/v2/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleShareNode = (nodeId: string) => {
    const doc = documents.find(d => d.id === nodeId);
    if (doc) {
      openShare(doc);
    }
  };
  const handlePreviewFile = async (document: Document) => {
    try {
      const encoded = encodeURIComponent(document.name);
      // 1) Fetch with auth header
      const res = await fetch(`http://localhost:8000/v2/preview/${encoded}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Preview fetch failed');

      // 2) Read it as a Blob
      const blob = await res.blob();

      // 3) Create an object URL so the browser can render it
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      setSelectedDocument(document);
      setShowSidebar(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Не удалось загрузить предпросмотр',
        variant: 'destructive',
      });
    }
  };

  // Download document
  const handleDownloadFile = async (doc: Document) => {
    try {
      const encodedFileName = encodeURIComponent(doc.name);
      const downloadUrl = `http://localhost:8000/v2/file/${encodedFileName}/download`;

      const response = await fetch(downloadUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({
        title: "Success",
        description: `Downloading: ${doc.name}`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  

  // Upload document
  const traverseFileTree = async (
    item: FileSystemEntry,
    path = '',
    fileList: File[] = []
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        const fileEntry = item as FileSystemFileEntry;
        fileEntry.file((file) => {
          (file as File & { relativePath?: string }).relativePath = path + file.name;
          fileList.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/', fileList);
          }
          resolve();
        });
      }
    });
  };

  const handleDropWithFolders = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry?.();
      if (item) {
        await traverseFileTree(item, '', files);
      }
    }

    type FileWithRelativePath = File & { relativePath?: string };
    const formData = new FormData();
    files.forEach(file => {
      const fileWithRelativePath = file as FileWithRelativePath;
      formData.append('files', file, fileWithRelativePath.relativePath || file.name);
    });

    try {
      const response = await axios.post("http://localhost:8000/v2/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };


  // Rename/update document metadata
  const handleUpdateMetadata = async (documentId: string, newName: string, tags?: string[], categories?: string[]) => {
    try {
      const response = await axios.put(`http://localhost:8000/v2/metadata/${documentId}`, {
        name: newName,
        tags: tags,
        categories: categories
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Success",
        description: `Document updated successfully`,
      });

      // Refresh document list
      fetchDocuments();

      // If this is the selected document, update it
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument({
          ...selectedDocument,
          name: newName,
          tags: tags || selectedDocument.tags,
          category: categories && categories.length > 0 ? categories[0] : selectedDocument.category,
        });
      }
    } catch (error) {
      console.error('Error updating document metadata:', error);
      toast({
        title: "Error",
        description: "Failed to update document metadata",
        variant: "destructive"
      });
    }
  };

  // Delete document (move to bin)
  const handleDeleteDocument = async (document: Document) => {
    try {
      // Encode the file name properly for the URL
      const encodedFileName = encodeURIComponent(document.name);
      await axios.delete(`http://localhost:8000/v2/${encodedFileName}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      toast({
        title: "Success",
        description: `Document moved to archive`,
      });

      // Refresh document list
      fetchDocuments();

      // If this document was selected, clear selection
      if (selectedDocument && selectedDocument.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to move document to bin",
        variant: "destructive"
      });
    }
  };
  const Caret = ({ direction }: { direction: 'asc' | 'desc' }) => (
    <span className="text-xs">{direction === 'asc' ? '▲' : '▼'}</span>
  );

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setShowSidebar(true);
  };

  const handleDocumentSelect = (document: Document) => {
    if (selectedDocumentIds.includes(document.id)) {
      setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== document.id));
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setShowSidebar(false);
      }
    } else {
      setSelectedDocumentIds([...selectedDocumentIds, document.id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
      setSelectedDocument(null);
      setShowSidebar(false);
    } else {
      setSelectedDocumentIds(documents.map(doc => doc.id));
      if (!selectedDocument && documents.length > 0) {
        setSelectedDocument(documents[0]);
        setShowSidebar(true);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDeleteSelected = async () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));

    let successCount = 0;
    let failCount = 0;

    for (const doc of selectedDocs) {
      try {
        const encodedFileName = encodeURIComponent(doc.name);
        await axios.delete(`http://localhost:8000/v2/${encodedFileName}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        successCount++;
      } catch (error) {
        console.error(`Error deleting document ${doc.name}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} document(s) moved to archive`,
      });

      // Refresh document list
      fetchDocuments();
    }

    if (failCount > 0) {
      toast({
        title: "Error",
        description: `Failed to move ${failCount} document(s) to bin`,
        variant: "destructive"
      });
    }

    setSelectedDocumentIds([]);
    setSelectedDocument(null);
    setShowSidebar(false);
  };

  const handleDownloadSelected = () => {
    const selectedDocs = documents.filter(doc => selectedDocumentIds.includes(doc.id));

    for (const doc of selectedDocs) {
      handleDownloadFile(doc);
    }
  };

  const handleShareSelected = () => {
    if (selectedDocumentIds.length > 0) {
      const doc = documents.find(d => d.id === selectedDocumentIds[0]);
      if (doc) openShare(doc);
    }
  };

  const handleSelectDestination = (destination: 'downloads' | 'new') => {
    toast({
      title: "Folder selected",
      description: destination === 'downloads' ? "Selected Downloads folder" : "Selected New folder",
    });
  };

  const handleCreateFolder = () => {
    toast({
      title: "Creating folder",
      description: "Creating new folder",
    });
  };

  const handleUploadToDestination = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const formData = new FormData();

    fileList.forEach(file => {
      formData.append('files', file, (file as File & { relativePath?: string }).relativePath || file.name);
    });

    try {
      const response = await axios.post("http://localhost:8000/v2/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast({
        title: "Success",
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleCloseSidebar = () => {
    setSelectedDocument(null);
    setPreviewUrl(null);
    setShowSidebar(false);
  };

  const getCategoryTitle = (type: CategoryType): string => {
    switch (type) {
      case 'all':
        return 'Все документы';
      case 'recent':
        return 'Недавние документы';
      case 'shared':
        return 'Общие документы';
      case 'favorites':
        return 'Избранные документы';
      case 'trash':
        return 'Корзина';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Drag and drop handlers for a dedicated drop area
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) {
        setIsDragging(false);
        return 0;
      }
      return next;
    });
  };

/** visible in the table / grid */
const visibleDocuments = React.useMemo(() => {
  if (folderId === null) {
    // root view
    return documents.filter(d => d.parent_id === null);
  }
  // inside a folder
  return documents.filter(d => d.parent_id === folderId);
}, [documents, folderId]);


  const handleDragOverArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);
    await handleDropWithFolders(e);
  };

  const archiveDocument = useCallback(async (doc: Document) => {
    try {
      const url = `/metadata/archive/${encodeURIComponent(doc.name)}`;
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) throw new Error('Archive failed');
      await response.json();
      toast({ title: 'Success', description: 'Document archived successfully', variant: 'default' });
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: `Failed to archive document: ${error.message}`, variant: 'destructive' });
    }
  }, [fetchDocuments]);

  const unarchiveDocument = useCallback(async (fileName: string) => {
    try {
      const url = `/v2/metadata/un-archive/${encodeURIComponent(fileName)}`;
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) throw new Error('Unarchive failed');
      await response.json();
      toast({ title: 'Success', description: 'Document unarchived successfully', variant: 'default' });
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: `Failed to unarchive document: ${error.message}`, variant: 'destructive' });
    }
  }, [fetchDocuments]);

  const toggleFavorite = useCallback(async (documentId: string) => {
    const docIndex = documents.findIndex(doc => doc.id === documentId);
    if (docIndex === -1) return;

    const prevStarred = documents[docIndex].starred;

    const updatedDocs = [...documents];
    updatedDocs[docIndex] = {
      ...updatedDocs[docIndex],
      starred: !prevStarred,
    };
    setDocuments(updatedDocs);

    try {
      const url = `/v2/metadata/${documentId}/star`;
      const response = await fetch(url, { method: 'PUT' });
      if (!response.ok) throw new Error('Toggle favorite failed');
      await response.json();
      toast({ title: 'Success', description: 'Favorite status updated', variant: 'default' });
      fetchDocuments();
    } catch (error) {
      const revertedDocs = [...documents];
      revertedDocs[docIndex] = {
        ...revertedDocs[docIndex],
        starred: prevStarred,
      };
      setDocuments(revertedDocs);
      toast({ title: 'Error', description: `Failed to update favorite status: ${error.message}`, variant: 'destructive' });
    }
  }, [documents, fetchDocuments]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const searchableKeys = ['name', 'type', 'owner', 'modified',];

const searchDocuments = (documents: DocumentType[], query: string) => {
  return documents.filter(doc =>
    searchableKeys.some(key => {
      const value = doc[key as keyof typeof doc];
      if (Array.isArray(value)) {
        return value.some(val => val.toLowerCase().includes(query));
      }
      return typeof value === 'string' && value.toLowerCase().includes(query);
    })
  );
};

 // 🔄 replace your existing filteredDocuments declaration with this
const filteredDocuments = React.useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  // ── 1) no query  →  just show the current folder view
  if (q === '') return visibleDocuments;

  // ── 2) with query →  search in *all* docs, not only the visible ones
  return documents.filter(doc =>
    searchableKeys.some(key => {
      const val = doc[key as keyof Document];
      if (Array.isArray(val)) {
        return val.some(v => v.toLowerCase().includes(q));
      }
      return typeof val === 'string' && val.toLowerCase().includes(q);
    })
  );
}, [documents, visibleDocuments, searchQuery]);


const toBytes = (size: string): number => {
  const [num, unit = 'B'] = size.split(' ');
  const n = parseFloat(num);
  switch (unit) {
    case 'MB': return n * 1_048_576;
    case 'KB': return n * 1_024;
    default:   return isNaN(n) ? 0 : n; // «B» или «--»
  }
};

 const sortedDocuments = React.useMemo(() => {
  return [...filteredDocuments].sort((a, b) => {
    let valA: string | number = a[sortBy] as any;
    let valB: string | number = b[sortBy] as any;

    // особый случай — размер
    if (sortBy === 'size') {
      valA = toBytes(a.size);
      valB = toBytes(b.size);
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });
}, [filteredDocuments, sortBy, sortOrder]);
  const folderTreeData: TreeNode[] = React.useMemo(() => {
    const folders = documents.filter(doc => doc.type === 'folder');
    return buildTree(folders);
  }, [documents]);



  return (
 <div className="flex flex-col h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
    <div className=" border-b shrink-0 bg-white/90 backdrop-blur-sm shadow-sm">

        {/*</div><div className="flex items-center justify-between mb-4">*/}
        <PageHeader
          
          title={getCategoryTitle(category)}
          categoryType={category}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          
        />
      </div>
  {/* left pane: folder tree  <nav className="w-64 overflow-auto h-screen p-2">*/
  }
  

 <div className="flex flex-1 overflow-hidden bg-dots">
      <nav className="w-64 overflow-y-auto border-r bg-white p-2 shadow-inner">
     <EnhancedFolderTree
        data={folderTreeData}
        selectedId={folderId}
        onSelect={(id) => {
      // если кликнули по той же папке ─ снимаем выбор
       setFolderId(prev => (prev === id ? null : id));

    }}      onFileUpload={handleFileUpload}
            onShare={handleShareNode}
            />
  </nav>
      <div className="flex-1 p-4 overflow-y-auto relative bg-gray-50 bg-dots">
      {/* Header with Upload Button */}
      
    
      {/* Drag-and-drop overlay */}
      <div
        className={`fixed inset-0 z-50${isDragging ? '' : ' hidden'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/50 border-4 border-dashed border-blue-400 flex items-center justify-center">
            <p className="text-lg font-semibold text-blue-600">Перетащите файлы для загрузки</p>
          </div>
        )}
      </div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOverArea}
        onDrop={handleDropArea}
      >
        {viewMode === 'list' ? (
          <div className="mt-4 ">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedDocumentIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                  onCheckedChange={handleSelectAll}
                  
                />
                   <span className="text-sm text-muted-foreground" >
    {selectedDocumentIds.length > 0
      ? `${selectedDocumentIds.length} selected`
      : `Showing ${filteredDocuments.length} items`}
  
                </span>
              </div>
               {selectedDocumentIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareSelected}
                  className="flex items-center gap-2"
                >
                  <Share className="h-4 w-4" />
                  Поделиться
                </Button>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedDocumentIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                    Name {sortBy === 'name' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
                    Description {sortBy === 'description' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('version')} className="cursor-pointer">
                    Version {sortBy === 'version' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('size')} className="cursor-pointer">
                    Size {sortBy === 'size' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('modified')} className="cursor-pointer">
                    Last updated {sortBy === 'modified' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead onClick={() => handleSort('owner')} className="cursor-pointer">
                    Updated by {sortBy === 'owner' && <Caret direction={sortOrder} />}
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-4 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDocuments.map((document) => (
                    <TableRow 
                      key={document.id}
                      className="hover:bg-accent/50 cursor-pointer"
                      onClick={() => handleDocumentClick(document)}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedDocumentIds.includes(document.id)}
                          onCheckedChange={() => handleDocumentSelect(document)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {renderIcon(document.type)}
                          <span className="font-medium">{document.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">--</span>
                      </TableCell>
                      <TableCell>
                        {document.type === 'folder' ? (
                          <span className="text-muted-foreground">--</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            V1
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{document.size}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {format(new Date(document.modified), 'MMM d, yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-medium">
                            MS
                          </div>
                          <span className="text-sm">Madiyar Saduakas</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openShare(document);
                        }}
                        className="h-8 w-8"
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                            <DropdownMenuItem onClick={() => handlePreviewFile(document)}>
                              Просмотр
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadFile(document)}>
                              Скачать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShare(document)}>
                              Поделиться
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveDocument(document)}>
                              Архивировать
                            </DropdownMenuItem> 
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteDocument(document)}
                            >
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
        ) : (
          <div className="mt-4 animate-fade-in">
            <DocumentGrid
              documents={filteredDocuments}
              onDocumentClick={handleDocumentClick}
              onDocumentPreview={handlePreviewFile}
              viewMode={viewMode}
              selectedDocument={selectedDocument}
              onDocumentSelect={handleDocumentSelect}
              multipleSelection={true}
              selectionActions={{
                selectedIds: selectedDocumentIds,
                onSelectAll: handleSelectAll,
                onClearSelection: handleClearSelection,
                onDeleteSelected: handleDeleteSelected,
                onDownloadSelected: handleDownloadSelected,
                onShareSelected: handleShareSelected
              }}
              toggleFavorite={toggleFavorite}
            />
          </div>
        )}
      </div>          </div>

      {isShareOpen && shareDoc && (
        <ShareModal
          document={shareDoc}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      {previewUrl && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <button
            className="absolute top-4 right-4 z-60 bg-white rounded-full p-2 shadow hover:bg-gray-200"
            onClick={() => { setPreviewUrl(null); }}
          >
            <span className="sr-only">Закрыть предпросмотр</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {selectedDocument.type === 'pdf' ? (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-[90vw] h-[90vh] bg-white rounded shadow-xl"
              title={selectedDocument.name}
            />
          ) : selectedDocument.type === 'image' ? (
            <img
              src={previewUrl}
              alt={selectedDocument.name}
              className="max-h-[90vh] max-w-[90vw] rounded shadow-xl bg-white"
            />
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-white mb-4">Предпросмотр</div>
              <iframe
                src={previewUrl}
                className="w-[1000px] h-[90vh] border-none"
                allowFullScreen
                title={selectedDocument.name || 'Document Preview'}
              />
            </div>
          )}
        </div>
      )}
      {/* Metadata sidebar only if not previewing */}
      {!previewUrl && showSidebar && selectedDocument && (
       <div className="w-128 border bg-gradient-to-b from-gray-50 via-white to-gray-100 fixed right-0 top-56 h-full z-40 shadow-lg rounded-l-xl">
          <MetadataSidebar
            document={selectedDocument}
            previewUrl={previewUrl}
            onClose={handleCloseSidebar}
            onDownload={selectedDocument ? () => handleDownloadFile(selectedDocument) : undefined}
            onDelete={selectedDocument ? () => handleDeleteDocument(selectedDocument) : undefined}
            onUpdateMetadata={handleUpdateMetadata}
            token={token}
          />
        </div>
        
      )}
      </div>
     
    </div>
  );
};

export default Index;
