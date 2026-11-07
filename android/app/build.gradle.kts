import org.gradle.api.tasks.Sync

plugins { id("com.android.application") }
val syncWebAssets by tasks.registering(Sync::class) {
    from(rootProject.projectDir.resolve("../web"))
    into(layout.buildDirectory.dir("generated/web-assets/www"))
}
android {
    namespace = "vn.spiritisles.game"
    compileSdk = 35
    defaultConfig {
        applicationId = "vn.spiritisles.game"
        minSdk = 26
        targetSdk = 35
        versionCode = 38
        versionName = "1.31.0"
    }
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web-assets"))
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
tasks.named("preBuild") { dependsOn(syncWebAssets) }
