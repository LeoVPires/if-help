import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TipoDemanda, LocalCampus, AmbienteLocal } from './../modals/chamado';
import { UserPerfil } from './auth';

@Injectable({
  providedIn: 'root',
})
export class ConfigurarLocaisService {
  private firestore = inject(Firestore);

  // ==========================================
  // 1. GERENCIAMENTO DE TIPOS DE DEMANDA
  // ==========================================
  getTiposDemanda(): Observable<TipoDemanda[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'tipos_demanda');
      const q = query(ref, orderBy('nome'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as TipoDemanda[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  addTipoDemanda(dados: TipoDemanda) {
    return addDoc(collection(this.firestore, 'tipos_demanda'), dados);
  }

  updateTipoDemanda(id: string, dados: Partial<TipoDemanda>) {
    return updateDoc(doc(this.firestore, `tipos_demanda/${id}`), dados);
  }

  deleteTipoDemanda(id: string) {
    return deleteDoc(doc(this.firestore, `tipos_demanda/${id}`));
  }

  // ==========================================
  // 2. GERENCIAMENTO DE LOCAIS E AMBIENTES (Com Subcoleções Dinâmicas)
  // ==========================================
  getLocaisComAmbientes(): Observable<LocalCampus[]> {
    // Primeiro Observable: Escuta os locais principais usando a mesma lógica estável
    const locais$ = new Observable<LocalCampus[]>((observer) => {
      const locaisRef = collection(this.firestore, 'locais');
      const qLocais = query(locaisRef, orderBy('nome'));

      const unsubscribe = onSnapshot(
        qLocais,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as LocalCampus[],
          );
        },
        (error) => observer.error(error),
      );
      return () => unsubscribe();
    });

    // Aninhando as subcoleções de ambientes em tempo real usando RxJS
    return locais$.pipe(
      switchMap((locais) => {
        if (locais.length === 0) return of([]);

        // Cria um array de observables para os ambientes de cada local
        const tarefas = locais.map((local) => {
          return new Observable<LocalCampus>((observer) => {
            const ambRef = collection(this.firestore, `locais/${local.id}/ambientes`);
            const qAmb = query(ambRef, orderBy('nome'));

            const unsubscribe = onSnapshot(
              qAmb,
              (snapshot) => {
                const ambientes = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })) as AmbienteLocal[];

                observer.next({ ...local, ambientes });
              },
              (error) => observer.error(error),
            );
            return () => unsubscribe();
          });
        });

        // Junta tudo e emite sempre que qualquer local ou ambiente for alterado
        return combineLatest(tarefas);
      }),
    );
  }

  addLocal(local: LocalCampus) {
    return addDoc(collection(this.firestore, 'locais'), { nome: local.nome, icone: local.icone });
  }

  updateLocal(id: string, dados: Partial<LocalCampus>) {
    return updateDoc(doc(this.firestore, `locais/${id}`), dados);
  }

  deleteLocal(id: string) {
    return deleteDoc(doc(this.firestore, `locais/${id}`));
  }

  addAmbiente(localId: string, ambiente: AmbienteLocal) {
    const ref = collection(this.firestore, `locais/${localId}/ambientes`);
    return addDoc(ref, ambiente);
  }

  updateAmbiente(localId: string, ambienteId: string, dados: Partial<AmbienteLocal>) {
    return updateDoc(doc(this.firestore, `locais/${localId}/ambientes/${ambienteId}`), dados);
  }

  deleteAmbiente(localId: string, ambienteId: string) {
    return deleteDoc(doc(this.firestore, `locais/${localId}/ambientes/${ambienteId}`));
  }

  // ==========================================
  // 3. BUSCA DE USUÁRIOS E ALTERAÇÃO DE ROLE
  // ==========================================
  buscarUsuariosPorNome(nome: string): Observable<UserPerfil[]> {
    return new Observable((observer) => {
      const ref = collection(this.firestore, 'usuarios');
      let q = query(ref, orderBy('nomeBusca'));

      if (nome.trim()) {
        const termo = nome.toLowerCase();

        q = query(
          ref,
          orderBy('nomeBusca'),
          where('nomeBusca', '>=', termo),
          where('nomeBusca', '<=', termo + '\uf8ff'),
        );
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          observer.next(
            snapshot.docs.map((doc) => ({
              uid: doc.id,
              ...doc.data(),
            })) as UserPerfil[],
          );
        },
        (error) => observer.error(error),
      );

      return () => unsubscribe();
    });
  }

  alterarRoleUsuario(uid: string, novaRole: 'admin' | 'servidor' | 'aluno') {
    const userDoc = doc(this.firestore, `usuarios/${uid}`);
    return updateDoc(userDoc, { role: novaRole });
  }
}
