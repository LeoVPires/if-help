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
import { Chamado, Nota } from '../modals/chamado';

// Interface rápida para tipar os usuários que vêm do banco
export interface Usuario {
  id: string;
  nome: string;
  role: 'admin' | 'servidor' | 'usuario';
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChamadosService {
  private firestore = inject(Firestore);

  // ==========================================
  // LISTAR USUÁRIOS PARA O SELECT DE RESPONSÁVEL (NOVO)
  // ==========================================
  getUsuarios(): Observable<Usuario[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'usuarios');
      // Filtra ou ordena se necessário, aqui busca todos
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Usuario[],
          );
        },
        (error) => observer.error(error),
      );
      return () => unsubscribe();
    });
  }

  // ==========================================
  // ESCUTAR UM CHAMADO ESPECÍFICO
  // ==========================================
  getChamadoById(id: string): Observable<Chamado> {
    return new Observable((observer) => {
      const chamadoDocRef = doc(this.firestore, `chamados/${id}`);

      const unsubscribe = onSnapshot(
        chamadoDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            observer.next({ id: snapshot.id, ...snapshot.data() } as Chamado);
          } else {
            observer.error(new Error('Chamado não encontrado no Firestore'));
          }
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  // ==========================================
  // ESCUTAR NOTAS DE UM CHAMADO
  // ==========================================
  getNotasChamado(chamadoId: string): Observable<Nota[]> {
    return new Observable((observer) => {
      const notasRef = collection(this.firestore, `chamados/${chamadoId}/notas`);
      const q = query(notasRef, orderBy('criadoEm', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Nota[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

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
  // 3. ATUALIZAR DADOS DO CHAMADO
  // ==========================================
  async updateChamado(id: string, dados: Partial<Chamado>): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${id}`);
    return updateDoc(chamadoDocRef, dados);
  }

  async updateStatusChamado(id: string, novoStatus: Chamado['status']): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${id}`);
    return updateDoc(chamadoDocRef, { status: novoStatus });
  }

  // ==========================================
  // 4. ATRIBUIR RESPONSÁVEL E MUDAR STATUS
  // ==========================================
  async atribuirResponsavel(chamadoId: string, uid: string, nome: string): Promise<void> {
    const chamadoDocRef = doc(this.firestore, `chamados/${chamadoId}`);
    return updateDoc(chamadoDocRef, {
      atribuidoPara: uid,
      atribuidoParaNome: nome,
      //status: 'Em Execução',
    });
  }

  // ==========================================
  // 5. ADICIONAR NOTA
  // ==========================================
  async addNota(chamadoId: string, nota: Nota): Promise<any> {
    const notasCollection = collection(this.firestore, `chamados/${chamadoId}/notas`);
    return addDoc(notasCollection, {
      autorNome: nota.autorNome,
      autorFuncao: nota.autorFuncao,
      texto: nota.texto,
      criadoEm: new Date().toISOString(),
    });
  }
}
