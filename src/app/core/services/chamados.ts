import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Chamado } from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class ChamadosService {
  private firestore = inject(Firestore);

  // 1. BUSCAR todos os chamados
  getChamados(): Observable<Chamado[]> {
    // Criar a referência aqui dentro garante o Injection Context correto!
    const chamadosCollection = collection(this.firestore, 'chamados');
    return collectionData(chamadosCollection, { idField: 'id' }) as Observable<Chamado[]>;
  }

  // 2. CRIAR um novo chamado
  async addChamado(chamado: Chamado): Promise<any> {
    const chamadosCollection = collection(this.firestore, 'chamados');
    delete chamado.id;
    return addDoc(chamadosCollection, chamado);
  }

  // 3. ATUALIZAR um chamado (ex: mudar status)
  async updateStatusChamado(id: string, novoStatus: string): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${id}`);
    return updateDoc(chamadoDocRef, { status: novoStatus });
  }

  // 4. ADICIONAR NOTA (Subcoleção)
  async addNota(chamadoId: string, nota: any): Promise<any> {
    const notasCollection = collection(this.firestore, `chamados/${chamadoId}/notas`);
    return addDoc(notasCollection, nota);
  }
}
