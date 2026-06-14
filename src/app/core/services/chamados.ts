import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Chamado } from '../modals/chamado';

@Injectable({
  providedIn: 'root',
})
export class ChamadosService {
  private firestore = inject(Firestore);

  // ==========================================
  // 1. BUSCAR TODOS OS CHAMADOS
  // ==========================================
  getChamados(): Observable<Chamado[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'chamados');

      const q = query(ref, orderBy('criadoEm', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Chamado[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  // ==========================================
  // 2. CRIAR CHAMADO
  // ==========================================
  async addChamado(chamado: Chamado): Promise<any> {
    const chamadosCollection = collection(this.firestore, 'chamados');

    delete chamado.id;

    return addDoc(chamadosCollection, chamado);
  }

  // ==========================================
  // 3. ALTERAR STATUS
  // ==========================================
  async updateStatusChamado(id: string, novoStatus: Chamado['status']): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${id}`);

    return updateDoc(chamadoDocRef, {
      status: novoStatus,
    });
  }

  // ==========================================
  // 4. ATRIBUIR RESPONSÁVEL
  // ==========================================
  async atribuirResponsavel(chamadoId: string, uid: string, nome: string): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${chamadoId}`);

    return updateDoc(chamadoDocRef, {
      atribuidoPara: uid,
      atribuidoParaNome: nome,
    });
  }

  // ==========================================
  // 5. ADICIONAR NOTA
  // ==========================================
  async addNota(chamadoId: string, nota: any): Promise<any> {
    const notasCollection = collection(this.firestore, `chamados/${chamadoId}/notas`);

    return addDoc(notasCollection, nota);
  }
}
