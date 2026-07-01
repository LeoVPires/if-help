import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore'; // Mudamos docData para getDoc
import { Router } from '@angular/router';
import { Observable, of, from } from 'rxjs'; // Importamos o 'from' aqui
import { map, switchMap } from 'rxjs/operators';

export interface UserPerfil {
  uid: string;
  email: string;
  nome: string;
  role: 'admin' | 'aluno' | 'servidor';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // RESOLVIDO: Agora usa getDoc encapsulado num Observable com o 'from'
  usuarioPerfil$: Observable<UserPerfil | null> = user(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) return of(null);

      const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);

      // de Promise para Observable de forma segura sem o bug do docData
      return from(getDoc(userDocRef)).pipe(
        map((docSnap) => {
          // .data() extrai os dados do documento do Firestore se ele existir
          const dbUser = docSnap.exists() ? docSnap.data() : null;

          return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            nome: firebaseUser.displayName || '',

            role: dbUser ? dbUser['role'] || 'aluno' : 'aluno',
          } as UserPerfil;
        }),
      );
    }),
  );

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const resultado = await signInWithPopup(this.auth, provider);
      const email = resultado.user.email;

      if (email && email.endsWith('ifce.edu.br')) {
        const userDocRef = doc(this.firestore, `usuarios/${resultado.user.uid}`);

        // 1. Buscamos o documento no banco para ver se ele já existe
        const userSnap = await getDoc(userDocRef);

        // 2. Verificamos se é o primeiro login (documento não existe)
        if (!userSnap.exists()) {
          // Se não existe, salvamos as informações e definimos a role padrão
          await setDoc(userDocRef, {
            uid: resultado.user.uid,
            email: resultado.user.email,
            nome: resultado.user.displayName,
            nomeBusca: resultado.user.displayName?.toLowerCase() ?? '',
            role: 'aluno', // Salva como aluno apenas na primeira vez
          });
        }
        // Se o userSnap.exists() for true, ele ignora o if e não sobrescreve nada,
        // preservando roles como 'admin' ou 'servidor'.

        this.router.navigate(['/dashboard']);
      } else {
        await this.logout();
        throw new Error('Acesso permitido apenas para e-mails ifce.edu.br');
      }
    } catch (error: any) {
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
