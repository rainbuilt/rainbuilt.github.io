package com.example.fedorahello

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test

class CounterScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun clickingButtonIncreasesCount() {
        composeRule.setContent {
            MaterialTheme {
                CounterScreen()
            }
        }

        composeRule.onNodeWithText("누른 횟수: 0").assertIsDisplayed()
        composeRule.onNodeWithText("한 번 더").performClick()
        composeRule.onNodeWithText("누른 횟수: 1").assertIsDisplayed()
    }
}
