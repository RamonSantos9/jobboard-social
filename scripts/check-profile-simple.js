require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkProfile() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    const db = mongoose.connection.db;

    // Buscar todos os usuários
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nEncontrados ${users.length} usuários:`);
    
    for (const user of users) {
      console.log(`- ${user.name} (${user.email})`);
      
      // Buscar perfil do usuário
      const profile = await db.collection('profiles').findOne({ userId: user._id });
      if (profile) {
        console.log(`  ✅ Perfil encontrado: ${profile.firstName} ${profile.lastName} (slug: ${profile.slug})`);
      } else {
        console.log(`  ❌ Perfil não encontrado`);
      }
    }

    // Buscar todos os perfis
    const profiles = await db.collection('profiles').find({}).toArray();
    console.log(`\nEncontrados ${profiles.length} perfis:`);
    
    for (const profile of profiles) {
      console.log(`- ${profile.firstName} ${profile.lastName} (slug: ${profile.slug})`);
      console.log(`  UserId: ${profile.userId}`);
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  }
}

checkProfile();
