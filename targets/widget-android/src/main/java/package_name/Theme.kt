package com.dashify.mobile

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceComposable
import androidx.glance.GlanceTheme
import androidx.glance.material3.ColorProviders

// Shared colors
val tealColor = Color(0xFF14D8D4)
val green500 = Color(0xFF31A855)
val red500 = Color(0xFFFE4E5C)
val gold400 = Color(0xFFF98E21)
val neutral000 = Color(0xFFFFFFFF)
val neutral200 = Color(0xFFE6ECF2)
val bgApp = Color(0xFF060B10)
val bgDark = Color(0xFF1E242C)

// Light colors
private val LightColorPalette = lightColorScheme(
    background = bgApp,
    onSurface = neutral000,
    primary = tealColor,
    error = red500,
    outline = gold400
)

// Dark colors
private val DarkColorPalette = darkColorScheme(
    background = bgApp,
    onSurface = neutral000,
    primary = tealColor,
    error = red500,
    outline = gold400
)

private val GlanceColors = ColorProviders(
    light = LightColorPalette,
    dark = DarkColorPalette
)

private val DashifyTypography = Typography(
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        color = neutral000
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 20.sp,
        color = neutral000
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        color = neutral000
    )
)

@Composable
fun DashifyMaterialTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorPalette else LightColorPalette

    MaterialTheme(
        colorScheme = colors,
        typography = DashifyTypography,
        content = content
    )
}

@Composable
@GlanceComposable
fun DashifyGlanceTheme(
    content: @Composable () -> Unit
) {
    GlanceTheme(
        colors = GlanceColors,
        content = content
    )
}

